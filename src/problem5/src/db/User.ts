import "reflect-metadata";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	OneToMany,
	Index,
} from "typeorm";
import { Item } from "./Item";

@Entity()
@Index(["username"])
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "varchar", unique: true })
	username!: string;

	@Column({ type: "varchar" })
	passwordHash!: string;

	@OneToMany(() => Item, (item) => item.user)
	items!: Item[];
}
