import { ThemeProvider, CSSReset } from '@chakra-ui/core';
import { Provider, createClient } from 'urql';
import theme from '../theme';

const client = createClient({
	url: 'http://localhost:4000/graphql',
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
