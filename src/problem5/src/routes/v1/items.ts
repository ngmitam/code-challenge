import { Router, Request, Response } from "express";
import { AppDataSource } from "../../db/database";
import { Item } from "../../db/Item";
import {
	validate,
	createItemSchema,
	updateItemSchema,
	getItemSchema,
	deleteItemSchema,
	listItemsSchema,
} from "../../middleware/validation";
import { authenticate, AuthRequest } from "../../middleware/auth";
import logger from "../../utils/logger";
import { cache } from "../../utils/cache";
import config from "../../config";

const router = Router();

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: My Item
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: This is a description of my item
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: My Item
 *                 description:
 *                   type: string
 *                   example: This is a description of my item
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
	"/",
	authenticate,
	validate(createItemSchema),
	async (req: AuthRequest, res: Response) => {
		const { name, description } = req.body;
		const userId = parseInt(req.user!.id);

		try {
			const itemRepository = AppDataSource.getRepository(Item);
			const item = itemRepository.create({ name, description, userId });
			const savedItem = await itemRepository.save(item);
			logger.info(`Item created with ID: ${savedItem.id}`, { userId });
			try {
				await cache.invalidateUserCache(userId.toString()); // Clear user's cache on modification
			} catch (cacheErr) {
				logger.error("Cache clear error", cacheErr);
			}
			res.status(201).json({
				id: savedItem.id,
				name: savedItem.name,
				description: savedItem.description || "",
				userId: savedItem.userId,
				createdAt: savedItem.createdAt,
				updatedAt: savedItem.updatedAt,
			});
		} catch (err) {
			logger.error("Failed to create item", err);
			return res.status(500).json({ error: "Internal server error" });
		}
	}
);

/**
 * @swagger
 * /items:
 *   get:
 *     summary: List user's items with optional filtering and pagination
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter items by name (partial match)
 *         example: test
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items to return
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of items to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: My Item
 *                   description:
 *                     type: string
 *                     example: This is a description
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get(
	"/",
	authenticate,
	validate(listItemsSchema),
	async (req: AuthRequest, res: Response) => {
		const { name, limit = 10, offset = 0 } = req.query as any;
		const userId = parseInt(req.user!.id);
		const cacheKey = `items:${userId}:${name || ""}:${limit}:${offset}`;

		try {
			const cached = await cache.get(cacheKey);
			if (cached) {
				logger.info("Serving from cache", { cacheKey, userId });
				return res.json(cached);
			}

			const itemRepository = AppDataSource.getRepository(Item);
			const queryBuilder = itemRepository.createQueryBuilder("item");

			queryBuilder.where("item.userId = :userId", { userId });

			if (name) {
				queryBuilder.andWhere("item.name LIKE :name", {
					name: `%${name}%`,
				});
			}

			const items = await queryBuilder
				.andWhere("item.deletedAt IS NULL")
				.orderBy("item.id", "DESC")
				.limit(limit)
				.offset(offset)
				.getMany();

			// Ensure description is never null in response
			const sanitizedItems = items.map((item) => ({
				id: item.id,
				name: item.name,
				description: item.description || "",
				userId: item.userId,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			}));

			await cache.set(
				cacheKey,
				sanitizedItems,
				config.performance.cacheTTL
			);
			res.json(sanitizedItems);
		} catch (err) {
			logger.error("Failed to list items", err);
			return res.status(500).json({ error: "Internal server error" });
		}
	}
);

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get details of a specific item
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Item ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: My Item
 *                 description:
 *                   type: string
 *                   example: This is a description
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.get(
	"/:id",
	authenticate,
	validate(getItemSchema),
	async (req: AuthRequest, res: Response) => {
		const { id } = req.params;
		const userId = parseInt(req.user!.id);

		// Validate ID format
		const itemId = parseInt(id);
		if (isNaN(itemId) || itemId <= 0) {
			return res.status(400).json({ error: "Invalid ID format" });
		}

		try {
			const itemRepository = AppDataSource.getRepository(Item);
			const item = await itemRepository.findOneBy({
				id: itemId,
				userId,
			});
			if (!item) {
				return res
					.status(404)
					.json({ error: "The requested item could not be found" });
			}
			res.json({
				id: item.id,
				name: item.name,
				description: item.description || "",
				userId: item.userId,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			});
		} catch (err) {
			logger.error("Failed to get item", err);
			return res.status(500).json({ error: "Internal server error" });
		}
	}
);

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update an existing item
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Item ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Updated Item
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Updated Item
 *                 description:
 *                   type: string
 *                   example: Updated description
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found or access denied
 *       500:
 *         description: Internal server error
 */
router.put(
	"/:id",
	authenticate,
	validate(updateItemSchema),
	async (req: AuthRequest, res: Response) => {
		const { id } = req.params;
		const { name, description } = req.body;
		const userId = parseInt(req.user!.id);

		// Validate ID format
		const itemId = parseInt(id);
		if (isNaN(itemId) || itemId <= 0) {
			return res.status(400).json({ error: "Invalid ID format" });
		}

		try {
			const itemRepository = AppDataSource.getRepository(Item);
			const item = await itemRepository.findOneBy({
				id: itemId,
				userId,
			});
			if (!item) {
				return res.status(404).json({
					error: "The requested item could not be found or you don't have permission to access it",
				});
			}
			item.name = name;
			if (description !== undefined) {
				item.description = description;
			}
			await itemRepository.save(item);
			logger.info(`Item updated with ID: ${id}`, { userId });
			try {
				await cache.invalidateUserCache(userId.toString()); // Clear user's cache on modification
			} catch (cacheErr) {
				logger.error("Cache clear error", cacheErr);
			}
			res.json({
				id: item.id,
				name: item.name,
				description: item.description || "",
				userId: item.userId,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			});
		} catch (err) {
			logger.error("Failed to update item", err);
			return res.status(500).json({ error: "Internal server error" });
		}
	}
);

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Soft delete an item
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Item ID
 *         example: 1
 *     responses:
 *       204:
 *         description: Item deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found or access denied
 *       500:
 *         description: Internal server error
 */
router.delete(
	"/:id",
	authenticate,
	validate(deleteItemSchema),
	async (req: AuthRequest, res: Response) => {
		const { id } = req.params;
		const userId = parseInt(req.user!.id);

		// Validate ID format
		const itemId = parseInt(id);
		if (isNaN(itemId) || itemId <= 0) {
			return res.status(400).json({ error: "Invalid ID format" });
		}

		try {
			const itemRepository = AppDataSource.getRepository(Item);
			const item = await itemRepository.findOneBy({
				id: itemId,
				userId,
			});
			if (!item) {
				return res.status(404).json({
					error: "The requested item could not be found or you don't have permission to access it",
				});
			}
			await itemRepository.softRemove(item);
			logger.info(`Item soft deleted with ID: ${id}`, { userId });
			try {
				await cache.invalidateUserCache(userId.toString()); // Clear user's cache on modification
			} catch (cacheErr) {
				logger.error("Cache clear error", cacheErr);
			}
			res.status(204).send();
		} catch (err) {
			logger.error("Failed to delete item", err);
			return res.status(500).json({ error: "Internal server error" });
		}
	}
);

export default router;
