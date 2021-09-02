import React from 'react';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { usePostsQuery } from '../generated/graphql';
import { Layout } from '../components/Layout';
import NextLink from 'next/link';
import { Link } from '@chakra-ui/core';

const Index = () => {
	const [{ data }] = usePostsQuery({
		variables: {
			limit: 30,
		},
	});

	return (
		<Layout>
			<NextLink href="/create-post">
				<Link>Create Post</Link>
			</NextLink>
			<br />
			{!data
				? null
				: data.posts.map((p) => <div key={p.id}>{p.title}</div>)}
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
