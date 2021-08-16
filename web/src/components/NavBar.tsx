import React from 'react';
import { Box, Flex, Link } from '@chakra-ui/core';
import NextLink from 'next/link';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
	return (
		<Flex bg="beige" p={3}>
			<Box ml={'auto'} color="black">
				<NextLink href="/login">
					<Link mr={3}>Login</Link>
				</NextLink>
				<NextLink href="/register">
					<Link mr={3}>Register</Link>
				</NextLink>
			</Box>
		</Flex>
	);
};
