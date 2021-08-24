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
import { FORGET_PASSWORD_PREFIX, USER_COOKIE } from '../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail';
import { v4 } from 'uuid';
import { getConnection } from 'typeorm';

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
		@Ctx() { redis, req }: MyContext
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

		const userIdNum = parseInt(userId);
		const user = await User.findOne(userIdNum);

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

		User.update(
			{ id: userIdNum },
			{ password: await argon2.hash(newPassword) }
		);

		await redis.del(key);

		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Ctx() { redis }: MyContext
	) {
		const user = await User.findOne(
			usernameOrEmail.includes('@')
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
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
	me(@Ctx() { req }: MyContext) {
		if (!req.session.userId) {
			// not logged in
			return null;
		}

		return User.findOne(req.session.userId);
	}

	@Mutation(() => UserResponse)
	async register(
		@Arg('options') options: UsernamePasswordInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const errors = validateRegister(options);
		if (errors) {
			return { errors };
		}

		const hashedPassword = await argon2.hash(options.password);

		let user;
		try {
			const result = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({
					username: options.username,
					password: hashedPassword,
					email: options.email,
				})
				.returning('*')
				.execute();
			user = result.raw[0];
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
		console.log('user.id: ', user.id);
		req.session.userId = user.id;

		return { user };
	}

	@Mutation(() => UserResponse)
	async login(
		@Arg('usernameOrEmail') usernameOrEmail: string,
		@Arg('password') password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const user = await User.findOne(
			usernameOrEmail.includes('@')
				? { where: { email: usernameOrEmail } }
				: { where: { username: usernameOrEmail } }
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
					resolve(false);
					return;
				}
				resolve(true);
			})
		);
	}
}
