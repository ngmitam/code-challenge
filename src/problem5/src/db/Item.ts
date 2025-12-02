import "reflect-metadata";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import { User } from "./User";

@Entity()
@Index(["userId", "deletedAt"])
export class Item {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "varchar", length: 100 })
	name!: string;

	@Column({ type: "text", nullable: true })
	description?: string;

	@Column({ type: "int", nullable: true })
	userId!: number;

	@ManyToOne(() => User)
	@JoinColumn({ name: "userId" })
	user!: User;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;

	@DeleteDateColumn()
	deletedAt?: Date;
}
