import React from 'react';
import { Box, Button } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import { InputField } from '../components/InputField';
import { Layout } from '../components/Layout';
import { useCreatePostMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { useIsAuth } from '../utils/useIsAuth';

const CreatePost: React.FC<{}> = ({}) => {
	useIsAuth();
	const router = useRouter();
	const [, createPost] = useCreatePostMutation();
	return (
		<Layout variant="small">
			<Formik
				initialValues={{ title: '', text: '' }}
				onSubmit={async (values) => {
					const error = await createPost({ input: values });
					if (!error) {
						router.push('/');
					}
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name="title"
							placeholder="title"
							label="Title"
						/>
						<Box mt={4}>
							<InputField
								textArea={true}
								name="text"
								placeholder="Write your post here"
								label="Your post"
							/>
						</Box>
						<Box
							display="flex"
							flexDirection="row"
							alignItems="center"
							mt={4}
						>
							<Button
								type="submit"
								isLoading={isSubmitting}
								variantColor="teal"
							>
								Post
							</Button>
						</Box>
					</Form>
				)}
			</Formik>
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient)(CreatePost);
