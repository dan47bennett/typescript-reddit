import { MyContext } from '../types';
import {
	Ctx,
	Resolver,
	Mutation,
	Arg,
	ObjectType,
	Field,
	Query,
} from 'type-graphql';
import { User } from '../entities/User';
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';
import { FORGET_PASSWORD_PREFIX, USER_COOKIE } from '../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';

@ObjectType()
class FieldError {
	@Field()
	field: string;
	@Field()
	message: string;
}

@ObjectType()
class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => User, { nullable: true })
	user?: User;
}

@Resolver()
export class UserResolver {
	@Mutation(() => UserResponse)
	async changePassword(
		@Arg('token') token: string,
		@Arg('newPassword') newPassword: string,
		@Ctx() { em, redis, req }: MyContext
	): Promise<UserResponse> {
		if (newPassword.length <= 4) {
			return {
				errors: [
					{
						field: 'newPassword',
						message: 'Password length must be greater than 4',
					},
				],
			};
		}

		const key = `${FORGET_PASSWORD_PREFIX}${token}`;

		const userId = await redis.get(key);

		if (!userId) {
			return {
				errors: [
					{
						field: 'token',
						message: 'Token expired',
					},
				],
			};
		}

		const user = await em.findOne(User, { id: parseInt(userId) });

		if (!user) {
			return {
				errors: [
					{
						field: 'token',
						message: 'Account no longer exists',
					},
				],
			};
		}

		user.password = await argon2.hash(newPassword);
		await em.persistAndFlush(user);

		await redis.del(key);

		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Ctx() { em, redis }: MyContext
	) {
		const user = await em.findOne(
			User,
			usernameOrEmail.includes('@')
				? { email: usernameOrEmail }
				: { username: usernameOrEmail }
		);
		if (!user) {
			// not in db
			return true;
		}

		const email = user.email;

		const token = v4(); //uuid

		await redis.set(
			`${FORGET_PASSWORD_PREFIX}${token}`,
			user.id,
			'ex',
			1000 * 60 * 60 * 1
		);

		sendEmail(
			email,
			'Password reset',
			`<a href="localhost:3000/change-password/${token}">Reset password</a>`
		);
		return true;
	}

	@Query(() => User, { nullable: true })
	async me(@Ctx() { em, req }: MyContext) {
		if (!req.session.userId) {
			// not logged in
			return null;
		}

		const user = await em.findOne(User, { id: req.session.userId });
		return user;
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options);
		if (errors) {
			return { errors };
		}

		const hashedPassword = await argon2.hash(options.password);

		let user;
		try {
			const response = await (em as EntityManager)
				.createQueryBuilder(User)
				.getKnexQuery()
				.insert({
					username: options.username,
					password: hashedPassword,
					email: options.email,
					created_at: new Date(), // _ instead of camelCase as mikroOrm changes automatically to underscores
					updated_at: new Date(),
				})
				.returning('*');
			user = response[0];
		} catch (err) {
			if (err.code === '23505') {
				if (err.detail.includes('email')) {
					return {
						errors: [
							{
								field: 'email',
								message:
									'There is already an account using that email address',
							},
						],
					};
				}
				if (err.detail.includes('username')) {
					return {
						errors: [
							{
								field: 'username',
								message: 'Username taken',
							},
						],
					};
				}
			}
		}

		// set login cookie
		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { em, req }: MyContext
	): Promise<UserResponse> {
		const user = await em.findOne(
			User,
			usernameOrEmail.includes('@')
				? { email: usernameOrEmail }
				: { username: usernameOrEmail }
		);
		if (!user) {
			return {
				errors: [
					{
						field: 'usernameOrEmail',
						message: 'No account matching that username or email.',
					},
				],
			};
		}

		const valid = await argon2.verify(user.password, password);
		if (!valid) {
			return {
				errors: [
					{
						field: 'password',
						message: 'Incorrect password.',
					},
				],
			};
		}

		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	logout(@Ctx() { req, res }: MyContext) {
		return new Promise((resolve) =>
			req.session.destroy((err) => {
				res.clearCookie(USER_COOKIE);
				if (err) {
					console.log('err: ', err);
					resolve(false);
					return;
				}
				resolve(true);
			})
		);
	}
}
