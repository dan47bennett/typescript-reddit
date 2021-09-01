import { useRouter } from 'next/dist/client/router';
import { useEffect } from 'react';
import { useMeQuery } from '../generated/graphql';

export const useIsAuth = () => {
	const [{ data, fetching }] = useMeQuery();
	const router = useRouter();
	useEffect(() => {
		if (!fetching && !data?.me) {
			console.log(
				'`/login?next=${router.pathname}`: ',
				`/login?next=${router.pathname}`
			);
			router.replace(`/login?next=${router.pathname}`);
		}
	}, [data, fetching, router]);
};
