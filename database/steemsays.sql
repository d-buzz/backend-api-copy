/*
SQLyog Ultimate v12.09 (64 bit)
MySQL - 10.4.11-MariaDB : Database - steemsays
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`steemsays` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `steemsays`;

/*Table structure for table `feeds` */

DROP TABLE IF EXISTS `feeds`;

CREATE TABLE `feeds` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `url` text DEFAULT NULL,
  `parent_author` varchar(191) DEFAULT NULL,
  `parent_url` text DEFAULT NULL,
  `parent_permlink` varchar(191) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `replies` text DEFAULT NULL,
  `voters` text DEFAULT NULL,
  `rebloggers` text DEFAULT NULL,
  `post_created` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `replies_count` int(12) DEFAULT 0,
  `reblog_count` int(12) DEFAULT 0,
  `voter_count` int(12) DEFAULT 0,
  `is_comment` tinyint(1) DEFAULT 0,
  `rank` int(12) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Table structure for table `notifications` */

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `sender` varchar(191) NOT NULL,
  `sender_metadata` text DEFAULT NULL,
  `type` varchar(191) NOT NULL,
  `date` datetime DEFAULT NULL,
  `notif_id` int(12) DEFAULT NULL,
  `url` varchar(191) DEFAULT NULL,
  `msg` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Table structure for table `user_twitter_verify` */

DROP TABLE IF EXISTS `user_twitter_verify`;

CREATE TABLE `user_twitter_verify` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `steem_id` int(12) NOT NULL,
  `username` varchar(121) NOT NULL,
  `generated_id` varchar(121) NOT NULL,
  `twitter_id` text DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verified_dt` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `steem_id` int(12) DEFAULT NULL,
  `is_member` tinyint(1) NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` text DEFAULT NULL,
  `follower_count` int(12) NOT NULL DEFAULT 0,
  `following_count` int(12) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_online` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Table structure for table `witnesses` */

DROP TABLE IF EXISTS `witnesses`;

CREATE TABLE `witnesses` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `witness_info` text DEFAULT NULL,
  `metadata` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_supported` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
