import React from 'react';
import { withUrqlClient } from 'next-urql';
import { NavBar } from '../components/NavBar';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
	return (
		<>
			<NavBar></NavBar>
			<div>hello world</div>
		</>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
