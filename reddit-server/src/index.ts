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
import { MyContext } from './types';

const main = async () => {
	const orm = await MikroORM.init(microConfig);
	await orm.getMigrator().up();

	const app = express();

	let RedisStore = connectRedis(session);
	let redisClient = redis.createClient();

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
			secret: 'aksjfhlaskdfjsadjfhsllasdhf',
			resave: false,
		})
	);

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false,
		}),
		context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
	});

	apolloServer.applyMiddleware({ app });

	app.listen(4000, () => {
		console.log('Server started on localhost:4000');
	});
};

main().catch((err) => {
	console.log('err: ', err);
});
