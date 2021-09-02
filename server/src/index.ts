import 'reflect-metadata';
import { USER_COOKIE, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { createConnection } from 'typeorm';
import { Post } from './entities/Post';
import { User } from './entities/User';
import path from 'path';

const main = async () => {
	const conn = await createConnection({
		type: 'postgres',
		database: 'lireddit',
		username: 'postgres',
		password: 'postgres',
		logging: true,
		synchronize: true,
		migrations: [path.join(__dirname, './migrations/*')],
		entities: [Post, User],
	});

	await conn.runMigrations();

	const app = express();

	let RedisStore = connectRedis(session);
	let redis = new Redis();

	redis.on('error', (err) => {
		console.log('Error ' + err);
	});

	app.use(
		cors({
			origin: 'http://localhost:3000',
			credentials: true,
		})
	);

	app.use(
		session({
			name: USER_COOKIE,
			store: new RedisStore({
				client: redis,
				disableTouch: true,
			}),
			cookie: {
				maxAge: 1000 * 3600 * 24 * 365 * 10, // 10 years in ms
				httpOnly: true,
				sameSite: 'lax',
				secure: __prod__, // only https
			},
			saveUninitialized: false,
			secret: 'aksjfhlaskdfjsadjfhsllasdhf',
			resave: false,
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }) => ({ req, res, redis }),
	});

	apolloServer.applyMiddleware({
		app,
		cors: false,
	});

	app.listen(4000, () => {
		console.log('Server started on localhost:4000');
	});
};

main().catch((err) => {
	console.log('err: ', err);
});
