-- Create characters table for character library feature
USE project_db;

CREATE TABLE IF NOT EXISTS `characters` (
  `character_id` BIGINT NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'Protagonist',
  `description` TEXT NULL,
  `traits` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`character_id`),
  INDEX `fk_characters_project_idx` (`project_id` ASC),
  CONSTRAINT `fk_characters_project`
    FOREIGN KEY (`project_id`)
    REFERENCES `project_db`.`projects` (`project_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARSET=utf8;
