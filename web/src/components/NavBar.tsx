import React from 'react';
import { Box, Button, Flex, Link } from '@chakra-ui/core';
import NextLink from 'next/link';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
	const [{ data, fetching }] = useMeQuery({
		pause: isServer(),
	});
	const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
	let body = null;

	if (fetching) {
		// loading
	} else if (!data?.me) {
		// logged in
		body = (
			<>
				<NextLink href="/login">
					<Link mr={3}>Login</Link>
				</NextLink>
				<NextLink href="/register">
					<Link mr={3}>Register</Link>
				</NextLink>
			</>
		);
	} else {
		body = (
			<>
				<Box mr={3}>{data.me.username}</Box>
				<Button
					onClick={() => {
						logout();
					}}
					variant="link"
					isLoading={logoutFetching}
				>
					Logout
				</Button>
			</>
		);
	}

	return (
		<Flex bg="beige" p={3}>
			<Box ml={'auto'} display="flex" flexDirection="row">
				{body}
			</Box>
		</Flex>
	);
};
