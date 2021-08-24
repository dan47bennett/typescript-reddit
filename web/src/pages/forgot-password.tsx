import { Box, Button } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const ForgotPassword: React.FC<{}> = ({}) => {
	const [complete, setComplete] = useState(false);
	const [, forgotPassword] = useForgotPasswordMutation();

	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ usernameOrEmail: '' }}
				onSubmit={async (values) => {
					await forgotPassword(values);
					setComplete(true);
				}}
			>
				{({ isSubmitting }) =>
					complete ? (
						<Box>
							If an account exists an email will have been sent to
							the registered email address
						</Box>
					) : (
						<Form>
							<InputField
								name="usernameOrEmail"
								placeholder="username or email"
								label="Username or Email"
							/>

							<Button
								mt={4}
								type="submit"
								isLoading={isSubmitting}
								variantColor="teal"
							>
								Send reset email
							</Button>
						</Form>
					)
				}
			</Formik>
		</Wrapper>
	);
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
