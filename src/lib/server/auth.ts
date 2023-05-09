import prisma from '$lib/prisma';
import { PRIVATE_SECRET_KEY } from '$env/static/private';
import * as jose from 'jose';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import bcrypt from 'bcrypt';

export const getUserFromToken = async (token: string) => {
	try {
		const {
			payload: { id }
		} = await jose.jwtVerify(token, new TextEncoder().encode(PRIVATE_SECRET_KEY));
		return await prisma.user.findUnique({ where: { id: id as number } });
	} catch {
		return null;
	}
};

export const getUserByName = async (name: string) => {
	return await prisma.user.findUnique({ where: { name } });
};

export const createUser = async (name: string, password: string) => {
	const passwordHash = await bcrypt.hash(password, 10);
	try {
		return await prisma.user.create({ data: { name, passwordHash } });
	} catch {
		return null;
	}
};

export const createToken = async (id: number) => {
	return await new jose.SignJWT({ id })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('2h')
		.sign(new TextEncoder().encode(PRIVATE_SECRET_KEY));
};

const registerSchema = z.object({
	username: z
		.string()
		.min(5, 'Username is too short. Minimum length is 5 symbols.')
		.max(30, 'Username is too long. Maximum length is 30 symbols.'),
	password: z
		.string()
		.min(5, 'Password is too short. Minimum length is 5 symbols.')
		.max(30, 'Password is too long. Maximum length is 30 symbols.')
});

export const parseForm = (formData: FormData) => {
	const input = Object.fromEntries(formData);
	const results = registerSchema.safeParse(input);
	return {
		error: results.success ? null : fromZodError(results.error).message,
		data: results.success ? results.data : null
	};
};
