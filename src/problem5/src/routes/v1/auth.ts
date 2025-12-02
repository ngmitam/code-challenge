import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import {
	generateToken,
	generateRefreshToken,
	authenticate,
	logout,
	refreshToken,
} from "../../middleware/auth";
import { AppDataSource } from "../../db/database";
import { User } from "../../db/User";
import logger from "../../utils/logger";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", async (req: Request, res: Response) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ error: "Please provide both username and password" });
	}

	try {
		const userRepository = AppDataSource.getRepository(User);
		const user = await userRepository.findOneBy({ username });

		if (!user) {
			logger.warn("Login attempt with invalid username", { username });
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const isValidPassword = await bcrypt.compare(
			password,
			user.passwordHash
		);
		if (!isValidPassword) {
			logger.warn("Login attempt with invalid password", { username });
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const token = generateToken(user.id.toString());
		const refreshTokenValue = generateRefreshToken(user.id.toString());
		logger.info("User logged in successfully", {
			userId: user.id,
			username,
		});
		res.json({
			token,
			refreshToken: refreshTokenValue,
			user: { id: user.id, username },
		});
	} catch (err) {
		logger.error("Database error during login", err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 1
 *                 example: newuser
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: mypassword
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     username:
 *                       type: string
 *                       example: newuser
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Username already exists
 */
router.post("/register", async (req: Request, res: Response) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ error: "Please provide both username and password" });
	}

	if (username.length > 50) {
		return res
			.status(400)
			.json({ error: "Username must be 50 characters or less" });
	}

	if (password.length < 6) {
		return res
			.status(400)
			.json({ error: "Password must be at least 6 characters long" });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		try {
			const userRepository = AppDataSource.getRepository(User);
			const user = userRepository.create({
				username,
				passwordHash: hashedPassword,
			});
			const savedUser = await userRepository.save(user);
			const token = generateToken(savedUser.id.toString());
			const refreshTokenValue = generateRefreshToken(
				savedUser.id.toString()
			);
			logger.info("User registered successfully", {
				userId: savedUser.id,
				username,
			});
			res.status(201).json({
				token,
				refreshToken: refreshTokenValue,
				user: { id: savedUser.id, username },
			});
		} catch (insertErr: any) {
			if (
				insertErr.code === "23505" ||
				insertErr.message?.includes("UNIQUE constraint failed")
			) {
				// PostgreSQL unique_violation or SQLite unique constraint
				logger.warn("Registration attempt with existing username", {
					username,
				});
				return res
					.status(409)
					.json({ error: "Username already exists" });
			}
			logger.error("Database error during registration", insertErr);
			return res.status(500).json({ error: "Internal server error" });
		}
	} catch (hashErr) {
		logger.error("Error hashing password", hashErr);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and blacklist token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authenticate, async (req: Request, res: Response) => {
	await logout(req, res);
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refreshToken);

export default router;
