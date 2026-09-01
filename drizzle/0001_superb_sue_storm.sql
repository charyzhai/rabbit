CREATE TABLE `encrypted_sync_packs` (
	`syncCode` varchar(20) NOT NULL,
	`encryptedPayload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `encrypted_sync_packs_syncCode` PRIMARY KEY(`syncCode`)
);
