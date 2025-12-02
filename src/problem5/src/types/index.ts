export interface Item {
	id?: number;
	name: string;
	description?: string;
}

export interface CreateItemRequest {
	name: string;
	description?: string;
}

export interface UpdateItemRequest {
	name: string;
	description?: string;
}

export interface ListItemsQuery {
	name?: string;
	limit?: number;
	offset?: number;
}
