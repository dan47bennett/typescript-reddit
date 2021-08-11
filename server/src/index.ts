import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';

const main = async () => {
	const orm = await MikroORM.init(microConfig);
	await orm.getMigrator().up();

	const app = express();

	let RedisStore = connectRedis(session);
	let redisClient = redis.createClient();

	redisClient.on('error', (err) => {
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
			name: 'qid',
			store: new RedisStore({
				client: redisClient,
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
		context: ({ req, res }) => ({ em: orm.em, req, res }),
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
