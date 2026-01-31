import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
  keepSignedIn?: boolean;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password, keepSignedIn }: SignInParams): Promise<void> => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { data } = res.data;

    if (!data?.accessToken) {
      throw new Error('Access token not found in response');
    }

    // Fetch current user to check status before completing sign-in
    const meRes = await axios.get(endpoints.auth.me, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    const user = meRes.data?.user ?? meRes.data?.data?.user;
    if (user?.status === 'inactive') {
      throw new Error('Your account is inactive. Please contact your administrator.');
    }

    await setSession(data.accessToken, keepSignedIn);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  email,
  password,
  firstName,
  lastName,
  phoneNumber,
}: SignUpParams): Promise<void> => {
  const params = {
    email,
    password,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
  };
  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { data } = res.data;

    if (!data?.accessToken) {
      throw new Error('Access token not found in response');
    }

    setSession(data.accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
