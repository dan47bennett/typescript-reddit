import { Request, Response } from 'express';
import { Redis } from 'ioredis';

export type MyContext = {
	req: Request & { session: { userId?: number } };
	res: Response;
	redis: Redis;
};
