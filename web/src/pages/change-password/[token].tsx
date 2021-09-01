import React, { useState } from 'react';
import { NextPage } from 'next';
import { Box, Button, Link } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { toErrorMap } from '../../utils/toErrorMap';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import NextLink from 'next/link';

const ChangePassword: React.FC<{}> = ({}) => {
	const router = useRouter();
	const [, changePassword] = useChangePasswordMutation();
	const [tokenError, setTokenError] = useState('');

	return (
		<Wrapper variant="small">
			<Formik
				initialValues={{ newPassword: '' }}
				onSubmit={async (values, { setErrors }) => {
					const response = await changePassword({
						newPassword: values.newPassword,
						token:
							typeof router.query.token === 'string'
								? router.query.token
								: '',
					});

					if (response.data?.changePassword.errors) {
						const errorMap = toErrorMap(
							response.data.changePassword.errors
						);

						if ('token' in errorMap) {
							setTokenError(errorMap.token);
						}

						setErrors(errorMap);
					} else if (response.data?.changePassword.user) {
						// worked, send to homepage
						router.push('/');
					}
				}}
			>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name="newPassword"
							placeholder="new password"
							label="New Password"
							type="password"
						/>

						{tokenError ? (
							<Box display="flex" flexDirection="row">
								<Box style={{ color: 'red' }}>{tokenError}</Box>
								<NextLink href="/forgot-password">
									<Link style={{ color: 'blue' }} ml="auto">
										Reset password again
									</Link>
								</NextLink>
							</Box>
						) : null}

						<Button
							mt={4}
							type="submit"
							isLoading={isSubmitting}
							variantColor="teal"
						>
							Change password
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	);
};

export default withUrqlClient(createUrqlClient)(ChangePassword);
