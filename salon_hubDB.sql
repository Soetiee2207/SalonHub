CREATE DATABASE  IF NOT EXISTS `salon_hub` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `salon_hub`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: salon_hub
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `provinceCode` varchar(255) NOT NULL,
  `provinceName` varchar(255) NOT NULL,
  `districtCode` varchar(255) NOT NULL,
  `districtName` varchar(255) NOT NULL,
  `wardCode` varchar(255) NOT NULL,
  `wardName` varchar(255) NOT NULL,
  `street` varchar(255) NOT NULL,
  `isDefault` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,7,'Nguyễn Văn A','0234234123','26','Tỉnh Vĩnh Phúc','253','Huyện Sông Lô','8848','Xã Đồng Thịnh','Thôn Thống Nhất',1,'2026-04-07 03:00:46','2026-04-07 03:00:46'),(2,8,'Nguyễn Ánh','0358215363','26','Tỉnh Vĩnh Phúc','253','Huyện Sông Lô','8848','Xã Đồng Thịnh','Shop hoa Phương Thảo, Thôn Chiến Thắng',1,'2026-04-07 14:50:26','2026-04-07 14:50:26'),(3,9,'Đỗ Hiếu','0936 363 3636','1','Thành phố Hà Nội','275','Huyện Quốc Oai','9949','Xã Hòa Thạch','Nhà to nhất xã',1,'2026-04-08 10:06:23','2026-04-08 10:06:23');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `staffId` int DEFAULT NULL,
  `branchId` int NOT NULL,
  `serviceId` int NOT NULL,
  `date` date NOT NULL,
  `startTime` varchar(255) NOT NULL,
  `endTime` varchar(255) DEFAULT NULL,
  `status` enum('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
  `note` text,
  `totalPrice` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cancelReason` text,
  `commissionAmount` decimal(10,2) DEFAULT '0.00',
  `orderId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `staffId` (`staffId`),
  KEY `branchId` (`branchId`),
  KEY `serviceId` (`serviceId`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `appointments_ibfk_247` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_248` FOREIGN KEY (`staffId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_249` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_250` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_251` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,8,2,1,4,'2026-04-11','17:00','18:00','completed','Cắt cho đẹp vào',180000.00,'2026-04-07 15:04:59','2026-04-07 15:07:14',NULL,0.00,NULL),(2,8,2,1,4,'2026-04-07','10:30','11:30','completed',NULL,180000.00,'2026-04-07 17:08:45','2026-04-07 17:23:51',NULL,0.00,NULL),(3,8,2,1,7,'2026-04-11','09:00','10:00','completed',NULL,300000.00,'2026-04-07 17:34:14','2026-04-07 17:35:05',NULL,0.00,NULL),(4,8,2,1,3,'2026-04-09','15:00','15:40','completed',NULL,120000.00,'2026-04-07 17:43:34','2026-04-07 17:44:55',NULL,0.00,NULL),(5,9,3,1,1,'2026-04-08','12:30','13:00','in_progress',NULL,80000.00,'2026-04-08 10:14:34','2026-04-08 10:14:59',NULL,0.00,NULL);
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `openTime` varchar(255) DEFAULT NULL,
  `closeTime` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'SalonHub Quận 1','123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM','028 3821 1234','08:00','21:00','https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=500&fit=crop','2026-03-15 07:56:18','2026-03-15 07:56:18'),(2,'SalonHub Quận 3','45 Võ Văn Tần, Phường 6, Quận 3, TP.HCM','028 3930 5678','08:30','21:30','https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&h=500&fit=crop','2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,'SalonHub Quận 7','789 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP.HCM','028 5412 9876','08:00','22:00','https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&h=500&fit=crop','2026-03-15 07:56:18','2026-03-15 07:56:18');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `productId` (`productId`),
  CONSTRAINT `carts_ibfk_115` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `carts_ibfk_116` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (14,7,16,1,'2026-04-07 17:55:11','2026-04-07 17:55:11');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_flow_transactions`
--

DROP TABLE IF EXISTS `cash_flow_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_flow_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('receipt','payment') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` enum('utilities','rent','salary','supplier_payment','outside_income','refund','other') NOT NULL,
  `method` enum('cash','bank') NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `referenceType` enum('order','appointment','inventory_import','manual') DEFAULT 'manual',
  `referenceId` int DEFAULT NULL,
  `note` text,
  `createdBy` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `cash_flow_transactions_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_flow_transactions`
--

LOCK TABLES `cash_flow_transactions` WRITE;
/*!40000 ALTER TABLE `cash_flow_transactions` DISABLE KEYS */;
INSERT INTO `cash_flow_transactions` VALUES (1,'receipt',552000.00,'other','cash','completed','order',4,'Ghi nhận doanh thu từ COD cho đơn hàng #4',5,'2026-04-07 14:20:58','2026-04-07 14:20:58'),(2,'receipt',1330000.00,'other','cash','completed','order',3,'Ghi nhận doanh thu từ COD cho đơn hàng #3',5,'2026-04-07 14:20:59','2026-04-07 14:20:59'),(3,'payment',5000000.00,'supplier_payment','bank','pending','inventory_import',7,'Thanh toán nhập kho lô LO-BHB862 - SP: Máy uốn tóc Philips BHB862',6,'2026-04-07 14:22:58','2026-04-07 14:22:58'),(4,'receipt',520000.00,'other','cash','completed','order',6,'Ghi nhận doanh thu từ COD cho đơn hàng #6',5,'2026-04-07 15:11:20','2026-04-07 15:11:20'),(5,'receipt',500000.00,'other','cash','completed','order',5,'Ghi nhận doanh thu từ COD cho đơn hàng #5',5,'2026-04-07 15:11:20','2026-04-07 15:11:20'),(6,'receipt',370000.00,'other','cash','completed','order',9,'Ghi nhận doanh thu từ COD cho đơn hàng #9',5,'2026-04-07 18:17:05','2026-04-07 18:17:05'),(7,'receipt',150000.00,'other','cash','completed','order',10,'Ghi nhận doanh thu từ COD cho đơn hàng #10',5,'2026-04-08 10:11:40','2026-04-08 10:11:40');
/*!40000 ALTER TABLE `cash_flow_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_service_notes`
--

DROP TABLE IF EXISTS `customer_service_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_service_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `staffId` int NOT NULL,
  `appointmentId` int DEFAULT NULL,
  `serviceId` int DEFAULT NULL,
  `notes` text,
  `formulas` text,
  `photos` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customerId` (`customerId`),
  KEY `staffId` (`staffId`),
  KEY `appointmentId` (`appointmentId`),
  CONSTRAINT `customer_service_notes_ibfk_43` FOREIGN KEY (`customerId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `customer_service_notes_ibfk_44` FOREIGN KEY (`staffId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `customer_service_notes_ibfk_45` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_service_notes`
--

LOCK TABLES `customer_service_notes` WRITE;
/*!40000 ALTER TABLE `customer_service_notes` DISABLE KEYS */;
INSERT INTO `customer_service_notes` VALUES (1,9,3,5,1,'Cắt undercut','',NULL,'2026-04-08 10:15:39','2026-04-08 10:15:39'),(2,9,3,5,1,'Cắt undercut','',NULL,'2026-04-08 10:15:43','2026-04-08 10:15:43'),(3,9,3,5,1,'Cắt moi','',NULL,'2026-04-08 10:23:47','2026-04-08 10:23:47');
/*!40000 ALTER TABLE `customer_service_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventories`
--

DROP TABLE IF EXISTS `inventories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `branchId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `minQuantity` int NOT NULL DEFAULT '10' COMMENT 'Định mức tồn kho tối thiểu để cảnh báo',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `productId` (`productId`),
  KEY `branchId` (`branchId`),
  CONSTRAINT `inventories_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `inventories_ibfk_2` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventories`
--

LOCK TABLES `inventories` WRITE;
/*!40000 ALTER TABLE `inventories` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `batchId` int DEFAULT NULL,
  `type` enum('import','export','adjust') NOT NULL,
  `quantity` int NOT NULL,
  `note` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `stockBefore` int NOT NULL,
  `stockAfter` int NOT NULL,
  `referenceType` enum('order','manual','appointment') DEFAULT NULL,
  `referenceId` int DEFAULT NULL,
  `createdBy` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `productId` (`productId`),
  KEY `batchId` (`batchId`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `inventory_transactions_ibfk_132` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_133` FOREIGN KEY (`batchId`) REFERENCES `product_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_134` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (1,16,1,'import',20,'Bù thêm số lượng','2026-04-07 11:39:40','2026-04-07 11:39:40',12,32,'manual',NULL,6,20000.00),(2,16,NULL,'export',1,'Xuất kho thực tế cho đơn #2','2026-04-07 11:48:58','2026-04-07 11:48:58',32,31,'order',2,6,NULL),(3,1,NULL,'export',1,'Xuất kho thực tế cho đơn #2','2026-04-07 11:48:58','2026-04-07 11:48:58',47,46,'order',2,6,NULL),(4,16,NULL,'export',1,'Xuất kho thực tế (Đang đóng gói) cho đơn #4','2026-04-07 12:55:44','2026-04-07 12:55:44',31,30,'order',4,6,NULL),(5,5,NULL,'export',2,'Xuất kho thực tế (Đang đóng gói) cho đơn #4','2026-04-07 12:55:44','2026-04-07 12:55:44',100,98,'order',4,6,NULL),(6,4,NULL,'export',1,'Xuất kho thực tế (Đang đóng gói) cho đơn #4','2026-04-07 12:55:44','2026-04-07 12:55:44',25,24,'order',4,6,NULL),(7,14,2,'import',50,'Nhập thêm máy uốn tóc','2026-04-07 14:22:58','2026-04-07 14:22:58',10,60,'manual',NULL,6,100000.00),(8,17,NULL,'export',1,'Xuất kho thực tế (Đang đóng gói) cho đơn #6','2026-04-07 14:53:20','2026-04-07 14:53:20',50,49,'order',6,6,NULL),(9,2,NULL,'export',1,'Xuất kho thực tế (Đang đóng gói) cho đơn #6','2026-04-07 14:53:20','2026-04-07 14:53:20',35,34,'order',6,6,NULL),(10,2,NULL,'export',1,'Xuất kho thực tế (Đang đóng gói) cho đơn #9','2026-04-07 18:16:14','2026-04-07 18:16:14',34,33,'order',9,6,NULL),(11,17,NULL,'export',1,'Xuất kho thực tế (Đang đóng gói) cho đơn #10','2026-04-08 10:09:14','2026-04-08 10:09:14',47,46,'order',10,6,NULL);
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) DEFAULT '0',
  `type` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (2,8,'Đặt tiền/lịch thành công','Lịch hẹn #1 của Quý khách vào ngày 2026-04-11, khung giờ 17:00 đã được tiếp nhận. Hệ thống sẽ sớm gửi xác nhận cho Quý khách.',1,'appointment','2026-04-07 15:04:59','2026-04-07 16:53:47'),(3,2,'Phân công phục vụ lịch hẹn','Bạn được phân công phục vụ lịch hẹn #1 vào ngày 2026-04-11, lúc 17:00. Vui lòng kiểm tra và chuẩn bị chu đáo.',0,'appointment','2026-04-07 15:04:59','2026-04-07 15:04:59'),(4,8,'Cập nhật lịch hẹn - Đã xác nhận','Lịch hẹn #1 ngày 2026-04-11 đã được cập nhật: Đã xác nhận.',1,'appointment','2026-04-07 15:05:52','2026-04-07 16:53:47'),(5,2,'Cập nhật lịch hẹn - Đã xác nhận','Lịch hẹn #1 ngày 2026-04-11 đã chuyển sang: Đã xác nhận.',0,'appointment','2026-04-07 15:05:52','2026-04-07 15:05:52'),(6,8,'Cập nhật lịch hẹn - Đang thực hiện','Lịch hẹn #1 ngày 2026-04-11 đã được cập nhật: Đang thực hiện.',1,'appointment','2026-04-07 15:06:32','2026-04-07 16:53:47'),(7,2,'Cập nhật lịch hẹn - Đang thực hiện','Lịch hẹn #1 ngày 2026-04-11 đã chuyển sang: Đang thực hiện.',0,'appointment','2026-04-07 15:06:32','2026-04-07 15:06:32'),(8,8,'Đặt tiền/lịch thành công','Lịch hẹn #2 của Quý khách vào ngày 2026-04-07, khung giờ 10:30 đã được tiếp nhận. Hệ thống sẽ sớm gửi xác nhận cho Quý khách.',0,'appointment','2026-04-07 17:08:45','2026-04-07 17:08:45'),(9,2,'Phân công phục vụ lịch hẹn','Bạn được phân công phục vụ lịch hẹn #2 vào ngày 2026-04-07, lúc 10:30. Vui lòng kiểm tra và chuẩn bị chu đáo.',0,'appointment','2026-04-07 17:08:45','2026-04-07 17:08:45'),(10,8,'Đặt tiền/lịch thành công','Lịch hẹn #3 của Quý khách vào ngày 2026-04-11, khung giờ 09:00 đã được tiếp nhận. Hệ thống sẽ sớm gửi xác nhận cho Quý khách.',0,'appointment','2026-04-07 17:34:14','2026-04-07 17:34:14'),(11,2,'Phân công phục vụ lịch hẹn','Bạn được phân công phục vụ lịch hẹn #3 vào ngày 2026-04-11, lúc 09:00. Vui lòng kiểm tra và chuẩn bị chu đáo.',0,'appointment','2026-04-07 17:34:14','2026-04-07 17:34:14'),(12,8,'Cập nhật lịch hẹn - Đã xác nhận','Lịch hẹn #3 ngày 2026-04-11 đã được cập nhật: Đã xác nhận.',0,'appointment','2026-04-07 17:34:39','2026-04-07 17:34:39'),(13,2,'Cập nhật lịch hẹn - Đã xác nhận','Lịch hẹn #3 ngày 2026-04-11 đã chuyển sang: Đã xác nhận.',0,'appointment','2026-04-07 17:34:39','2026-04-07 17:34:39'),(14,8,'Cập nhật lịch hẹn - Đang thực hiện','Lịch hẹn #3 ngày 2026-04-11 đã được cập nhật: Đang thực hiện.',0,'appointment','2026-04-07 17:34:44','2026-04-07 17:34:44'),(15,2,'Cập nhật lịch hẹn - Đang thực hiện','Lịch hẹn #3 ngày 2026-04-11 đã chuyển sang: Đang thực hiện.',0,'appointment','2026-04-07 17:34:44','2026-04-07 17:34:44'),(17,8,'Đặt tiền/lịch thành công','Lịch hẹn #4 của Quý khách vào ngày 2026-04-09, khung giờ 15:00 đã được tiếp nhận. Hệ thống sẽ sớm gửi xác nhận cho Quý khách.',0,'appointment','2026-04-07 17:43:34','2026-04-07 17:43:34'),(18,2,'Phân công phục vụ lịch hẹn','Bạn được phân công phục vụ lịch hẹn #4 vào ngày 2026-04-09, lúc 15:00. Vui lòng kiểm tra và chuẩn bị chu đáo.',0,'appointment','2026-04-07 17:43:34','2026-04-07 17:43:34'),(19,8,'Cập nhật lịch hẹn - Đã xác nhận','Lịch hẹn #4 ngày 2026-04-09 đã được cập nhật: Đã xác nhận.',0,'appointment','2026-04-07 17:44:27','2026-04-07 17:44:27'),(20,2,'Cập nhật lịch hẹn - Đã xác nhận','Lịch hẹn #4 ngày 2026-04-09 đã chuyển sang: Đã xác nhận.',0,'appointment','2026-04-07 17:44:27','2026-04-07 17:44:27'),(21,8,'Cập nhật lịch hẹn - Đang thực hiện','Lịch hẹn #4 ngày 2026-04-09 đã được cập nhật: Đang thực hiện.',0,'appointment','2026-04-07 17:44:42','2026-04-07 17:44:42'),(22,2,'Cập nhật lịch hẹn - Đang thực hiện','Lịch hẹn #4 ngày 2026-04-09 đã chuyển sang: Đang thực hiện.',0,'appointment','2026-04-07 17:44:42','2026-04-07 17:44:42'),(23,9,'Đặt tiền/lịch thành công','Lịch hẹn #5 của Quý khách vào ngày 2026-04-08, khung giờ 12:30 đã được tiếp nhận. Hệ thống sẽ sớm gửi xác nhận cho Quý khách.',0,'appointment','2026-04-08 10:14:34','2026-04-08 10:14:34'),(24,3,'Phân công phục vụ lịch hẹn','Bạn được phân công phục vụ lịch hẹn #5 vào ngày 2026-04-08, lúc 12:30. Vui lòng kiểm tra và chuẩn bị chu đáo.',0,'appointment','2026-04-08 10:14:34','2026-04-08 10:14:34');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `productId` (`productId`),
  CONSTRAINT `order_items_ibfk_115` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_116` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (2,2,16,1,12000.00,'2026-04-07 10:34:42','2026-04-07 10:34:42'),(3,2,1,1,350000.00,'2026-04-07 10:34:42','2026-04-07 10:34:42'),(4,3,4,1,550000.00,'2026-04-07 12:54:49','2026-04-07 12:54:49'),(5,3,10,1,780000.00,'2026-04-07 12:54:49','2026-04-07 12:54:49'),(6,4,16,1,12000.00,'2026-04-07 12:55:22','2026-04-07 12:55:22'),(7,4,5,2,95000.00,'2026-04-07 12:55:22','2026-04-07 12:55:22'),(8,4,4,1,550000.00,'2026-04-07 12:55:22','2026-04-07 12:55:22'),(9,5,17,1,150000.00,'2026-04-07 14:50:36','2026-04-07 14:50:36'),(10,5,1,1,350000.00,'2026-04-07 14:50:36','2026-04-07 14:50:36'),(11,6,17,1,150000.00,'2026-04-07 14:51:15','2026-04-07 14:51:15'),(12,6,2,1,420000.00,'2026-04-07 14:51:15','2026-04-07 14:51:15'),(13,7,17,1,150000.00,'2026-04-07 17:35:05','2026-04-07 17:35:05'),(14,7,1,1,350000.00,'2026-04-07 17:35:05','2026-04-07 17:35:05'),(15,8,17,1,150000.00,'2026-04-07 17:44:55','2026-04-07 17:44:55'),(16,8,12,1,220000.00,'2026-04-07 17:44:55','2026-04-07 17:44:55'),(17,9,2,1,420000.00,'2026-04-07 17:55:52','2026-04-07 17:55:52'),(18,10,17,1,150000.00,'2026-04-08 10:08:47','2026-04-08 10:08:47'),(19,11,9,1,115000.00,'2026-04-08 10:26:34','2026-04-08 10:26:34'),(20,11,12,1,220000.00,'2026-04-08 10:26:34','2026-04-08 10:26:34');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','packing','shipping','delivered','completed','cancelled') DEFAULT 'pending',
  `trackingCode` varchar(255) DEFAULT NULL,
  `paymentMethod` enum('cod','vnpay') NOT NULL,
  `paymentStatus` enum('pending','paid','refunded') DEFAULT 'pending',
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `voucherId` int DEFAULT NULL,
  `discountAmount` decimal(10,2) DEFAULT '0.00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `appointmentId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `voucherId` (`voucherId`),
  CONSTRAINT `orders_ibfk_115` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_116` FOREIGN KEY (`voucherId`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,7,362000.00,'completed','A000001','cod','pending','Thôn Thống Nhất, Xã Đồng Thịnh, Huyện Sông Lô, Tỉnh Vĩnh Phúc','0234234123',NULL,0.00,'2026-04-07 10:34:42','2026-04-07 12:41:02',NULL),(3,7,1330000.00,'cancelled',NULL,'cod','paid','Thôn Thống Nhất, Xã Đồng Thịnh, Huyện Sông Lô, Tỉnh Vĩnh Phúc','0234234123',NULL,0.00,'2026-04-07 12:54:49','2026-04-07 14:20:59',NULL),(4,7,552000.00,'completed','A120000','cod','paid','Thôn Thống Nhất, Xã Đồng Thịnh, Huyện Sông Lô, Tỉnh Vĩnh Phúc','0234234123',2,200000.00,'2026-04-07 12:55:22','2026-04-07 14:20:58',NULL),(5,8,500000.00,'cancelled',NULL,'cod','paid','Shop hoa Phương Thảo, Thôn Chiến Thắng, Xã Đồng Thịnh, Huyện Sông Lô, Tỉnh Vĩnh Phúc','0358215363',NULL,0.00,'2026-04-07 14:50:36','2026-04-07 15:11:20',NULL),(6,8,520000.00,'completed','A12345','cod','paid','Shop hoa Phương Thảo, Thôn Chiến Thắng, Xã Đồng Thịnh, Huyện Sông Lô, Tỉnh Vĩnh Phúc','0358215363',1,50000.00,'2026-04-07 14:51:15','2026-04-07 15:11:20',NULL),(7,8,500000.00,'completed',NULL,'cod','paid',NULL,NULL,NULL,0.00,'2026-04-07 17:35:05','2026-04-07 17:35:05',3),(8,8,370000.00,'completed',NULL,'cod','paid',NULL,NULL,NULL,0.00,'2026-04-07 17:44:55','2026-04-07 17:44:55',4),(9,7,370000.00,'completed','A12412','cod','paid','Thôn Thống Nhất, Xã Đồng Thịnh, Huyện Sông Lô, Tỉnh Vĩnh Phúc','0234234123',1,50000.00,'2026-04-07 17:55:52','2026-04-07 18:17:16',NULL),(10,9,150000.00,'completed','A45126','cod','paid','Nhà to nhất xã, Xã Hòa Thạch, Huyện Quốc Oai, Thành phố Hà Nội','0936 363 3636',NULL,0.00,'2026-04-08 10:08:47','2026-04-08 10:11:40',NULL),(11,8,167500.00,'pending',NULL,'cod','pending','Shop hoa Phương Thảo, Thôn Chiến Thắng, Xã Đồng Thịnh, Huyện Sông Lô, Tỉnh Vĩnh Phúc','0358215363',2,167500.00,'2026-04-08 10:26:34','2026-04-08 10:26:34',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int DEFAULT NULL,
  `appointmentId` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('cod','vnpay','cash') NOT NULL,
  `transactionId` varchar(255) DEFAULT NULL,
  `status` enum('pending','success','failed','refunded') DEFAULT 'pending',
  `vnpayData` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isReconciled` tinyint(1) DEFAULT '0',
  `reconciledAt` datetime DEFAULT NULL,
  `reconciledBy` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `appointmentId` (`appointmentId`),
  KEY `reconciledBy` (`reconciledBy`),
  CONSTRAINT `payments_ibfk_136` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_137` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_138` FOREIGN KEY (`reconciledBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,3,NULL,1330000.00,'cod',NULL,'success',NULL,'2026-04-07 12:54:49','2026-04-07 14:20:59',1,'2026-04-07 14:20:59',5),(2,4,NULL,552000.00,'cod',NULL,'success',NULL,'2026-04-07 12:55:22','2026-04-07 14:20:58',1,'2026-04-07 14:20:58',5),(3,5,NULL,500000.00,'cod',NULL,'success',NULL,'2026-04-07 14:50:36','2026-04-07 15:11:20',1,'2026-04-07 15:11:20',5),(4,6,NULL,520000.00,'cod',NULL,'success',NULL,'2026-04-07 14:51:15','2026-04-07 15:11:20',1,'2026-04-07 15:11:20',5),(5,9,NULL,370000.00,'cod',NULL,'success',NULL,'2026-04-07 17:55:52','2026-04-07 18:17:05',1,'2026-04-07 18:17:05',5),(6,10,NULL,150000.00,'cod',NULL,'success',NULL,'2026-04-08 10:08:47','2026-04-08 10:11:40',1,'2026-04-08 10:11:40',5),(7,11,NULL,167500.00,'cod',NULL,'pending',NULL,'2026-04-08 10:26:34','2026-04-08 10:26:34',0,NULL,NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_batches`
--

DROP TABLE IF EXISTS `product_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `productId` int NOT NULL,
  `batchNumber` varchar(50) DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `quantity` int DEFAULT '0',
  `purchasePrice` decimal(10,2) DEFAULT NULL,
  `warehouseLocation` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `productId` (`productId`),
  CONSTRAINT `product_batches_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_batches`
--

LOCK TABLES `product_batches` WRITE;
/*!40000 ALTER TABLE `product_batches` DISABLE KEYS */;
INSERT INTO `product_batches` VALUES (1,16,'LO-1-2026','2026-04-07',20,20000.00,'Kệ 1 - Tầng 2','2026-04-07 11:39:40','2026-04-07 11:39:40'),(2,14,'LO-BHB862','2026-04-07',50,100000.00,'Kệ 3 tầng 4','2026-04-07 14:22:58','2026-04-07 14:22:58');
/*!40000 ALTER TABLE `product_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES (1,'Sáp vuốt tóc','Các loại sáp, wax tạo kiểu tóc','2026-03-15 07:56:18','2026-03-15 07:56:18'),(2,'Dầu gội & Dầu xả','Dầu gội đầu và dầu xả chăm sóc tóc','2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,'Dưỡng tóc','Serum, tinh dầu, xịt dưỡng tóc','2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,'Dụng cụ tạo kiểu','Máy sấy, máy uốn, lược chải tóc','2026-03-15 07:56:18','2026-03-15 07:56:18');
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `reply` text,
  `replyAt` datetime DEFAULT NULL,
  `isHidden` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `productId` (`productId`),
  CONSTRAINT `product_reviews_ibfk_115` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `product_reviews_ibfk_116` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (1,8,17,5,'Dùng quá tuyệt vời','2026-04-07 16:54:20','2026-04-07 16:54:20',NULL,NULL,0),(2,8,2,5,'Cái này dùng khá tốt','2026-04-07 17:02:05','2026-04-07 17:02:05',NULL,NULL,0);
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `reservedStock` int DEFAULT '0',
  `minStock` int DEFAULT '5',
  `image` varchar(255) DEFAULT NULL,
  `categoryId` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Sáp vuốt tóc Osis+ Mess Up','Sáp vuốt tóc Schwarzkopf Osis+ Mess Up tạo kiểu matte finish, giữ nếp trung bình. Phù hợp tóc ngắn và trung bình.',350000.00,45,0,5,'https://www.planetbeauty.com/cdn/shop/files/Schwarzkopf_Professional_Osis_Mess_Up__4.jpg?v=1711485143',1,1,'2026-03-15 07:56:18','2026-04-07 17:35:05'),(2,'Sáp By Vilain Gold Digger','Sáp vuốt tóc By Vilain Gold Digger giữ nếp mạnh, matte finish tự nhiên. Hương thơm nam tính.',420000.00,33,0,5,'https://sgpomades.com/cdn/shop/files/By-Vilain-Gold-Digger-65ml-SGPomades-Discover-Joy-in-Self-Care-6677.jpg?v=1716970597',1,1,'2026-03-15 07:56:18','2026-04-07 18:16:14'),(3,'Pomade Reuzel Blue','Pomade gốc nước Reuzel Blue Strong Hold, bóng vừa, dễ gội sạch. Hương vanilla cola.',380000.00,40,0,5,'https://ishampoos.com/cdn/shop/files/reuzel-blue-pomade-strong-hold-water-soluble-113g4oz-852578006010.jpg?v=1773416233',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,'Clay Baxter of California','Sáp clay Baxter of California tạo kiểu matte, giữ nếp mạnh, phù hợp tóc dày.',550000.00,24,0,5,'https://www.apothecarie.com/cdn/shop/products/302-45834_7314a050-ba3a-4137-b488-b4d6122905a9.jpg?v=1662486112',1,1,'2026-03-15 07:56:18','2026-04-07 12:55:44'),(5,'Wax Gatsby Moving Rubber','Gatsby Moving Rubber Spiky Edge, giữ nếp cứng, tạo kiểu tóc gai dễ dàng.',95000.00,98,0,5,'https://japanesetaste.com/cdn/shop/files/P-1-MND-WAX-SP-80-Mandom_Gatsby_Moving_Rubber_Hair_Wax_Spiky_Edge_80g_450x450.jpg?v=1743424944',1,1,'2026-03-15 07:56:18','2026-04-07 12:55:44'),(6,'Dầu gội TRESemmé Keratin Smooth','Dầu gội TRESemmé Keratin Smooth giúp tóc suôn mượt, giảm xơ rối, chai 640ml.',155000.00,60,0,5,'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(7,'Dầu gội Head & Shoulders','Dầu gội Head & Shoulders sạch gàu, mát lạnh bạc hà, chai 625ml.',135000.00,80,0,5,'https://www.herbsdaily.com/cdn/shop/files/98316_a30e85f2-30aa-4711-9a82-07385c469c23.jpg?v=1751322089',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(8,'Dầu gội Moroccanoil','Dầu gội Moroccanoil Moisture Repair cho tóc hư tổn, chiết xuất dầu Argan, chai 250ml.',520000.00,20,0,5,'https://www.imagebeauty.com/cdn/shop/products/image-4.jpg?v=1642114070',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(9,'Dầu xả Dove Phục Hồi Hư Tổn','Dầu xả Dove Intensive Repair phục hồi tóc hư tổn, chai 620ml.',115000.00,70,1,5,'https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=600&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-04-08 10:26:34'),(10,'Serum dưỡng tóc Moroccanoil Treatment','Tinh dầu dưỡng tóc Moroccanoil Original Treatment, giúp tóc bóng mượt, giảm xơ, 100ml.',780000.00,15,0,5,'https://livelovespa.com/cdn/shop/files/Untitleddesign-2023-08-17T161533.454.png?v=1692314178',3,1,'2026-03-15 07:56:18','2026-04-07 12:54:55'),(11,'Xịt dưỡng tóc Mise en Scene','Xịt dưỡng tóc Mise en Scene Perfect Serum Mist, dưỡng ẩm không gây bết, 150ml.',165000.00,45,0,5,'https://www.masksheets.com/cdn/shop/files/newitem-2025-11-11T120533.889.png?v=1762881026',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(12,'Tinh dầu Argan L\'Oréal','Tinh dầu dưỡng tóc L\'Oréal Extraordinary Oil chiết xuất Argan, 100ml.',220000.00,29,1,5,'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&h=600&fit=crop',3,1,'2026-03-15 07:56:18','2026-04-08 10:26:34'),(13,'Máy sấy tóc Panasonic EH-ND65','Máy sấy tóc Panasonic 2000W, 3 chế độ nhiệt, ion dưỡng tóc.',650000.00,15,0,5,'https://www.esh2u.com/cdn/shop/files/2_d6a358d6-7fe3-4b6c-8c23-cdce405d2f09.png?v=1730880811',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(14,'Máy uốn tóc Philips BHB862','Máy uốn tóc Philips StyleCare, thanh uốn 25mm, lớp phủ Ceramic.',490000.00,60,0,5,'https://gandhiappliances.com/cdn/shop/products/eh-na-65-k_1024x.jpg?v=1608492995',4,1,'2026-03-15 07:56:18','2026-04-07 14:22:58'),(15,'Lược chải tóc Tangle Teezer','Lược gỡ rối Tangle Teezer Original, chải tóc không đau, phù hợp mọi loại tóc.',280000.00,40,0,5,'https://us.tangleteezer.com/cdn/shop/files/PinkFizz_OR_PDP_1.png?v=1762110971',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(16,'tt','tt',12000.00,30,0,5,'https://res.cloudinary.com/daytrfyrg/image/upload/v1773561550/salon_hub/w6pj1k9nsmpej1asvear.jpg',2,1,'2026-03-15 07:59:11','2026-04-07 12:55:44'),(17,'Tinh dầu bưởi','Tinh dầu dưỡng tóc',150000.00,46,0,5,'https://res.cloudinary.com/daytrfyrg/image/upload/v1775571588/salon_hub/vgoihzxa5t3xtjhlzcgv.jpg',3,1,'2026-04-07 14:19:49','2026-04-08 10:09:14');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refund_requests`
--

DROP TABLE IF EXISTS `refund_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refund_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('order','appointment') NOT NULL,
  `targetId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `processedBy` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `processedBy` (`processedBy`),
  CONSTRAINT `refund_requests_ibfk_1` FOREIGN KEY (`processedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_requests`
--

LOCK TABLES `refund_requests` WRITE;
/*!40000 ALTER TABLE `refund_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `refund_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `staffId` int DEFAULT NULL,
  `appointmentId` int DEFAULT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `reply` text,
  `replyAt` datetime DEFAULT NULL,
  `isHidden` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `staffId` (`staffId`),
  KEY `appointmentId` (`appointmentId`),
  CONSTRAINT `reviews_ibfk_172` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_173` FOREIGN KEY (`staffId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_174` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,8,2,1,5,'Cắt đẹp, tuyệt vời','2026-04-07 15:07:42','2026-04-07 15:10:45','Cảm ơn khách hàng','2026-04-07 15:10:45',0);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_categories`
--

DROP TABLE IF EXISTS `service_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_categories`
--

LOCK TABLES `service_categories` WRITE;
/*!40000 ALTER TABLE `service_categories` DISABLE KEYS */;
INSERT INTO `service_categories` VALUES (1,'Cắt tóc','Các dịch vụ cắt tóc nam nữ','2026-03-15 07:56:18','2026-03-15 07:56:18'),(2,'Uốn tóc','Các dịch vụ uốn tóc chuyên nghiệp','2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,'Nhuộm tóc','Nhuộm tóc thời trang và phủ bạc','2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,'Phục hồi & Dưỡng','Phục hồi tóc hư tổn, dưỡng tóc sâu','2026-03-15 07:56:18','2026-03-15 07:56:18'),(5,'Gội & Massage','Gội đầu thư giãn kết hợp massage','2026-03-15 07:56:18','2026-03-15 07:56:18');
/*!40000 ALTER TABLE `service_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `duration` int NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `categoryId` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `service_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Cắt tóc nam cơ bản','Cắt tóc nam theo yêu cầu, bao gồm gội và sấy tạo kiểu',80000.00,30,'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-04-07 09:17:28'),(2,'Cắt tóc nam cao cấp','Cắt tóc nam với stylist chuyên nghiệp, tư vấn kiểu phù hợp khuôn mặt',150000.00,45,'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,'Cắt tóc nữ ngắn','Cắt tóc nữ ngắn thời trang, bao gồm gội sấy',120000.00,40,'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,'Cắt tóc nữ dài','Cắt tỉa, tạo kiểu tóc dài, bao gồm gội sấy tạo kiểu',180000.00,60,'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(5,'Uốn tóc nam Hàn Quốc','Uốn tóc nam kiểu Hàn Quốc tự nhiên, giữ nếp lâu 3-6 tháng',350000.00,90,'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(6,'Uốn tóc nữ lọn lớn','Uốn tóc nữ sóng lọn lớn bồng bềnh, sử dụng thuốc uốn cao cấp',500000.00,120,'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(7,'Uốn phồng chân tóc','Uốn phồng chân tóc tạo độ bồng tự nhiên',300000.00,60,'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(8,'Nhuộm tóc thời trang','Nhuộm tóc màu thời trang (nâu, vàng, đỏ, highlight...)',400000.00,90,'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(9,'Nhuộm phủ bạc','Nhuộm tóc phủ bạc với màu tự nhiên, an toàn cho da đầu',250000.00,60,'https://images.unsplash.com/photo-1560869713-bf165a3b2c81?w=800&h=600&fit=crop',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(10,'Phục hồi tóc Keratin','Phục hồi tóc hư tổn bằng Keratin cao cấp, tóc mềm mượt tức thì',600000.00,90,'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&h=600&fit=crop',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(11,'Hấp dầu phục hồi','Hấp dầu dưỡng tóc sâu, phục hồi tóc khô xơ',200000.00,45,'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&h=600&fit=crop',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(12,'Ủ tóc Collagen','Ủ tóc Collagen giúp tóc chắc khỏe, bóng mượt từ gốc đến ngọn',350000.00,60,'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&h=600&fit=crop',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(13,'Gội đầu dưỡng sinh','Gội đầu kết hợp massage đầu cổ vai gáy thư giãn',70000.00,30,'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',5,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(14,'Gội massage combo','Gội đầu + massage đầu + massage mặt + đắp mặt nạ',150000.00,45,'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',5,1,'2026-03-15 07:56:18','2026-03-15 07:56:18');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_schedules`
--

DROP TABLE IF EXISTS `staff_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `branchId` int NOT NULL,
  `dayOfWeek` int NOT NULL,
  `startTime` varchar(255) NOT NULL,
  `endTime` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `branchId` (`branchId`),
  CONSTRAINT `staff_schedules_ibfk_115` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `staff_schedules_ibfk_116` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_schedules`
--

LOCK TABLES `staff_schedules` WRITE;
/*!40000 ALTER TABLE `staff_schedules` DISABLE KEYS */;
INSERT INTO `staff_schedules` VALUES (38,4,1,1,'08:00','20:00','2026-04-08 10:13:23','2026-04-08 10:13:23'),(39,4,1,2,'08:00','20:00','2026-04-08 10:13:23','2026-04-08 10:13:23'),(40,4,1,3,'08:00','20:00','2026-04-08 10:13:23','2026-04-08 10:13:23'),(41,4,1,4,'08:00','20:00','2026-04-08 10:13:23','2026-04-08 10:13:23'),(42,4,1,5,'08:00','20:00','2026-04-08 10:13:23','2026-04-08 10:13:23'),(43,4,1,6,'08:00','20:00','2026-04-08 10:13:23','2026-04-08 10:13:23'),(44,3,1,1,'08:00','20:00','2026-04-08 10:13:29','2026-04-08 10:13:29'),(45,3,1,2,'08:00','20:00','2026-04-08 10:13:29','2026-04-08 10:13:29'),(46,3,1,3,'08:00','20:00','2026-04-08 10:13:29','2026-04-08 10:13:29'),(47,3,1,4,'08:00','20:00','2026-04-08 10:13:29','2026-04-08 10:13:29'),(48,3,1,5,'08:00','20:00','2026-04-08 10:13:29','2026-04-08 10:13:29'),(49,3,1,6,'08:00','20:00','2026-04-08 10:13:29','2026-04-08 10:13:29'),(50,2,1,1,'08:00','20:00','2026-04-08 10:13:31','2026-04-08 10:13:31'),(51,2,1,2,'08:00','20:00','2026-04-08 10:13:31','2026-04-08 10:13:31'),(52,2,1,3,'08:00','20:00','2026-04-08 10:13:31','2026-04-08 10:13:31'),(53,2,1,4,'08:00','20:00','2026-04-08 10:13:31','2026-04-08 10:13:31'),(54,2,1,5,'08:00','20:00','2026-04-08 10:13:31','2026-04-08 10:13:31'),(55,2,1,6,'08:00','20:00','2026-04-08 10:13:31','2026-04-08 10:13:31');
/*!40000 ALTER TABLE `staff_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_skills`
--

DROP TABLE IF EXISTS `staff_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `serviceId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_skills_serviceId_userId_unique` (`userId`,`serviceId`),
  KEY `serviceId` (`serviceId`),
  CONSTRAINT `staff_skills_ibfk_115` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `staff_skills_ibfk_116` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_skills`
--

LOCK TABLES `staff_skills` WRITE;
/*!40000 ALTER TABLE `staff_skills` DISABLE KEYS */;
INSERT INTO `staff_skills` VALUES (3,2,3,'2026-04-06 17:59:33','2026-04-06 17:59:33'),(5,3,1,'2026-04-06 18:00:06','2026-04-06 18:00:06'),(6,3,2,'2026-04-06 18:00:06','2026-04-06 18:00:06'),(8,4,1,'2026-04-06 18:00:33','2026-04-06 18:00:33'),(9,4,2,'2026-04-06 18:00:33','2026-04-06 18:00:33'),(10,4,3,'2026-04-06 18:00:33','2026-04-06 18:00:33'),(11,4,4,'2026-04-06 18:00:33','2026-04-06 18:00:33'),(12,4,5,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(13,4,6,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(14,4,7,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(15,4,8,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(16,4,9,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(17,4,11,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(18,4,10,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(19,4,12,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(20,4,14,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(21,4,13,'2026-04-07 14:31:59','2026-04-07 14:31:59'),(22,2,4,'2026-04-07 14:32:06','2026-04-07 14:32:06'),(23,2,7,'2026-04-07 14:32:06','2026-04-07 14:32:06'),(24,2,8,'2026-04-07 14:32:06','2026-04-07 14:32:06'),(25,2,6,'2026-04-07 14:32:23','2026-04-07 14:32:23'),(26,2,9,'2026-04-07 14:32:23','2026-04-07 14:32:23'),(27,2,10,'2026-04-07 14:32:23','2026-04-07 14:32:23'),(28,2,11,'2026-04-07 14:32:23','2026-04-07 14:32:23'),(29,2,12,'2026-04-07 14:32:23','2026-04-07 14:32:23'),(30,2,13,'2026-04-07 14:32:23','2026-04-07 14:32:23'),(31,2,14,'2026-04-07 14:32:23','2026-04-07 14:32:23'),(32,3,14,'2026-04-07 14:32:33','2026-04-07 14:32:33');
/*!40000 ALTER TABLE `staff_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `role` enum('customer','staff','admin','warehouse_staff','service_staff','accountant','accountant_staff','receptionist') DEFAULT 'customer',
  `branchId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `loyaltyPoints` int DEFAULT '0',
  `rank` enum('Silver','Gold','Diamond') DEFAULT 'Silver',
  `workStatus` enum('available','break','busy') DEFAULT 'available',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  UNIQUE KEY `email_61` (`email`),
  UNIQUE KEY `email_62` (`email`),
  KEY `branchId` (`branchId`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Administrator','admin@salonhub.vn','$2b$10$vhhfNOIWC0D9FGgyZ4r0kOtlQqAznQafjtU2uN2QbpNOdGozVtsjq','0900000000',NULL,'admin',NULL,'2026-04-06 17:57:44','2026-04-06 17:57:44',0,'Silver','available'),(2,'Nguyễn Nhật Minh','minh@salonhub.vn','$2b$10$mpSEJRRsf/pUpskdOiDxrOWDYLGSXjEQqgnOx6MTSx.UyHMDCUfZ.','0123456789',NULL,'staff',1,'2026-04-06 17:59:33','2026-04-07 17:25:14',0,'Silver','available'),(3,'Nguyễn Chung Anh','anh@salonhub.vn','$2b$10$uqX7YrI24H8j.PMKEU7XhOh.wwFefpdpdpHJbZHMdvgNxPe6V7AWu','035829311234',NULL,'staff',1,'2026-04-06 18:00:06','2026-04-07 14:52:21',0,'Silver','available'),(4,'Đỗ Minh Hiếu','hieu@salonhub.vn','$2b$10$G.9GFf0bIXhsOvJI2ZcnWeFU/qEir.rm6hB/vgJWLGyb0wzeB2.hG','03562193445',NULL,'staff',1,'2026-04-06 18:00:33','2026-04-07 14:52:13',0,'Silver','available'),(5,'Chu Hữu Hùng','hung@salonhub.vn','$2b$10$ZmHX0qcC/UqWkLoFG17.BudujR/3.u8l9P3o2JCvsux3MVUibUrIK','0123456774',NULL,'accountant',1,'2026-04-06 18:16:37','2026-04-08 10:13:47',0,'Silver','available'),(6,'Nguyễn Hiếu','nhieu@salonhub.vn','$2b$10$9fWIMY8VqegriU.VXbP3xOQsznklNCL6ShzjCFcFNtKyGRltc.jne','023465123',NULL,'warehouse_staff',2,'2026-04-06 18:17:22','2026-04-06 18:17:22',0,'Silver','available'),(7,'Nguyễn Văn A','nguyenvana@gmail.com','$2b$10$kH0qlO.Ik8YwQeErUEhS6uarwSD3gtPAqcJFqpAYYebHXD7dLAPIq','0358215363',NULL,'customer',NULL,'2026-04-07 02:59:55','2026-04-07 18:17:16',1284,'Gold','available'),(8,'Nguyễn Nhật Ánh','nguyennhatanh@gmail.com','$2b$10$oeGJHBE7ldSb95xgrH930eSH9JQrDltHJpQlldwzN65.94B/3phxu','0358215363','https://res.cloudinary.com/daytrfyrg/image/upload/v1775573726/salon_hub/njefdrax1sdwjtjbvsze.png','customer',NULL,'2026-04-07 14:48:48','2026-04-07 17:44:55',3210,'Diamond','available'),(9,'Đỗ Minh Hiếu','dominhieu@gmail.com','$2b$10$a1c6hBmzKeGLqmQyl/2SVOOmY5/5D7VcTP0M3gTwx9btDGb3NukZK','0365 363 3636',NULL,'customer',NULL,'2026-04-08 10:04:49','2026-04-08 10:10:33',150,'Silver','available');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `discount` decimal(10,2) NOT NULL,
  `discountType` enum('percent','fixed') NOT NULL,
  `minOrderValue` decimal(10,2) DEFAULT '0.00',
  `maxDiscount` decimal(10,2) DEFAULT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `usageLimit` int DEFAULT NULL,
  `usedCount` int DEFAULT '0',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`),
  UNIQUE KEY `code_13` (`code`),
  UNIQUE KEY `code_14` (`code`),
  UNIQUE KEY `code_15` (`code`),
  UNIQUE KEY `code_16` (`code`),
  UNIQUE KEY `code_17` (`code`),
  UNIQUE KEY `code_18` (`code`),
  UNIQUE KEY `code_19` (`code`),
  UNIQUE KEY `code_20` (`code`),
  UNIQUE KEY `code_21` (`code`),
  UNIQUE KEY `code_22` (`code`),
  UNIQUE KEY `code_23` (`code`),
  UNIQUE KEY `code_24` (`code`),
  UNIQUE KEY `code_25` (`code`),
  UNIQUE KEY `code_26` (`code`),
  UNIQUE KEY `code_27` (`code`),
  UNIQUE KEY `code_28` (`code`),
  UNIQUE KEY `code_29` (`code`),
  UNIQUE KEY `code_30` (`code`),
  UNIQUE KEY `code_31` (`code`),
  UNIQUE KEY `code_32` (`code`),
  UNIQUE KEY `code_33` (`code`),
  UNIQUE KEY `code_34` (`code`),
  UNIQUE KEY `code_35` (`code`),
  UNIQUE KEY `code_36` (`code`),
  UNIQUE KEY `code_37` (`code`),
  UNIQUE KEY `code_38` (`code`),
  UNIQUE KEY `code_39` (`code`),
  UNIQUE KEY `code_40` (`code`),
  UNIQUE KEY `code_41` (`code`),
  UNIQUE KEY `code_42` (`code`),
  UNIQUE KEY `code_43` (`code`),
  UNIQUE KEY `code_44` (`code`),
  UNIQUE KEY `code_45` (`code`),
  UNIQUE KEY `code_46` (`code`),
  UNIQUE KEY `code_47` (`code`),
  UNIQUE KEY `code_48` (`code`),
  UNIQUE KEY `code_49` (`code`),
  UNIQUE KEY `code_50` (`code`),
  UNIQUE KEY `code_51` (`code`),
  UNIQUE KEY `code_52` (`code`),
  UNIQUE KEY `code_53` (`code`),
  UNIQUE KEY `code_54` (`code`),
  UNIQUE KEY `code_55` (`code`),
  UNIQUE KEY `code_56` (`code`),
  UNIQUE KEY `code_57` (`code`),
  UNIQUE KEY `code_58` (`code`),
  UNIQUE KEY `code_59` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'SUMMER 2026',20.00,'percent',10000.00,50000.00,'2026-04-07','2026-04-30',100,2,1,'2026-04-06 18:15:17','2026-04-07 17:55:52'),(2,'HOT 2026',50.00,'percent',100000.00,200000.00,'2026-04-07','2026-04-30',10,2,1,'2026-04-07 11:53:40','2026-04-08 10:26:34');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-08 18:43:29
