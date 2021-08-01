import { __prod__ } from './constants';
import { Post } from './entities/Post';
import { MikroORM } from '@mikro-orm/core';

export default {
	entities: [Post],
	dbName: 'lireddit',
	user: 'postgres',
	password: 'postgres',
	type: 'postgresql',
	debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
