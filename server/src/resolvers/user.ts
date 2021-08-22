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
import { USER_COOKIE } from '../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from 'src/utils/validateRegister';

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
	// @Mutation(() => Boolean)
	// async forgotPassword(
	// 	@Arg('email') email: string,
	// 	@Ctx() { em }: MyContext
	// ) {
	// 	// const person = await em.findOne(User, {email})
	// 	return true;
	// }

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
				//|| err.detail.includes('already exists')
				return {
					errors: [
						{
							field: 'username',
							message: 'Username already taken',
						},
					],
				};
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
						field: 'username',
						message: "That username doesn't exist.",
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
