import { ThemeProvider, CSSReset } from '@chakra-ui/core';
import { Provider, createClient, dedupExchange, fetchExchange } from 'urql';
import { cacheExchange, Cache, QueryInput } from '@urql/exchange-graphcache';
import theme from '../theme';
import {
	LoginMutation,
	MeDocument,
	MeQuery,
	RegisterMutation,
} from '../generated/graphql';

function betterUpdateQuery<Result, Query>(
	cache: Cache,
	qi: QueryInput,
	result: any,
	fn: (r: Result, q: Query) => Query
) {
	return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}

const client = createClient({
	url: 'http://localhost:4000/graphql',
	exchanges: [
		dedupExchange,
		cacheExchange({
			updates: {
				Mutation: {
					login: (result: LoginMutation, args, cache, info) => {
						betterUpdateQuery<LoginMutation, MeQuery>(
							cache,
							{ query: MeDocument },
							result,
							(result, query) => {
								if (result.login.errors) {
									return query;
								} else {
									return {
										me: result.login.user,
									};
								}
							}
						);
					},
					register: (result: RegisterMutation, args, cache, info) => {
						betterUpdateQuery<RegisterMutation, MeQuery>(
							cache,
							{ query: MeDocument },
							result,
							(result, query) => {
								if (result.register.errors) {
									return query;
								} else {
									return {
										me: result.register.user,
									};
								}
							}
						);
					},
				},
			},
		}),
		fetchExchange,
	],
	fetchOptions: {
		credentials: 'include',
	},
});

function MyApp({ Component, pageProps }) {
	return (
		<Provider value={client}>
			<ThemeProvider theme={theme}>
				<CSSReset />
				<Component {...pageProps} />
			</ThemeProvider>
		</Provider>
	);
}

export default MyApp;
