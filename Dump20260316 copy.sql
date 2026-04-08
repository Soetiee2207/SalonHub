-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: salon_hub
-- ------------------------------------------------------
-- Server version	8.0.41

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,1,'test','0987878787','1','Thành phố Hà Nội','21','Quận Bắc Từ Liêm','616','Phường Cổ Nhuế 1','111',1,'2026-03-15 08:23:15','2026-03-15 08:23:15'),(2,1,'tt','0967456454','1','Thành phố Hà Nội','268','Quận Hà Đông','10117','Phường Đồng Mai','111',0,'2026-03-15 08:25:02','2026-03-15 08:25:02');
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
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `staffId` (`staffId`),
  KEY `branchId` (`branchId`),
  KEY `serviceId` (`serviceId`),
  CONSTRAINT `appointments_ibfk_20` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_21` FOREIGN KEY (`staffId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_22` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `appointments_ibfk_23` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,5,2,1,1,'2026-03-10','09:00','09:30','completed','Cắt ngắn gọn gàng',80000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(2,5,2,1,5,'2026-03-12','14:00','15:30','completed','Uốn kiểu Hàn Quốc',350000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(3,6,4,2,6,'2026-03-14','10:00','12:00','confirmed',NULL,500000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(4,7,3,1,8,'2026-03-15','09:00','10:30','pending','Nhuộm nâu vàng',400000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(5,6,4,2,14,'2026-03-16','15:00','15:45','confirmed',NULL,150000.00,'2026-03-15 07:56:19','2026-03-15 07:58:44'),(6,1,2,1,1,'2026-03-19','13:00','13:30','pending',NULL,80000.00,'2026-03-15 08:01:58','2026-03-15 08:01:58'),(7,1,2,1,11,'2026-03-18','09:30','10:15','pending',NULL,200000.00,'2026-03-15 08:06:23','2026-03-15 08:06:23'),(8,1,2,1,2,'2026-03-18','11:00','11:45','pending',NULL,150000.00,'2026-03-15 08:24:42','2026-03-15 08:24:42');
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
  CONSTRAINT `carts_ibfk_10` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `carts_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,5,'Đặt lịch thành công','Bạn đã đặt lịch cắt tóc nam cơ bản vào ngày 10/03/2026 lúc 09:00.',1,'appointment','2026-03-15 07:56:19','2026-03-15 07:56:19'),(2,5,'Đơn hàng đã giao','Đơn hàng #1 của bạn đã được giao thành công. Cảm ơn bạn đã mua hàng!',1,'order','2026-03-15 07:56:19','2026-03-15 07:56:19'),(3,6,'Lịch hẹn được xác nhận','Lịch hẹn uốn tóc nữ ngày 14/03/2026 đã được xác nhận. Hẹn gặp bạn!',0,'appointment','2026-03-15 07:56:19','2026-03-15 07:56:19'),(4,7,'Khuyến mãi đặc biệt','Sử dụng mã CHAOBAN để được giảm 20% cho đơn hàng tiếp theo!',0,'promotion','2026-03-15 07:56:19','2026-03-15 07:56:19'),(5,5,'Ưu đãi mùa hè','Mã SUMMER30 giảm 30% cho đơn từ 500.000đ. Áp dụng từ 01/06 đến 31/08/2026.',0,'promotion','2026-03-15 07:56:19','2026-03-15 07:56:19');
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
  CONSTRAINT `order_items_ibfk_10` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_9` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,1,350000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(2,1,3,1,380000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(3,2,6,1,155000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(4,2,9,1,115000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(5,3,4,1,550000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(6,3,11,2,165000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(7,4,1,2,350000.00,'2026-03-15 08:02:19','2026-03-15 08:02:19'),(8,5,2,2,420000.00,'2026-03-15 08:06:41','2026-03-15 08:06:41'),(9,5,1,1,350000.00,'2026-03-15 08:06:41','2026-03-15 08:06:41'),(10,6,1,1,350000.00,'2026-03-15 08:36:29','2026-03-15 08:36:29'),(11,7,1,1,350000.00,'2026-03-15 08:36:37','2026-03-15 08:36:37');
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
  `status` enum('pending','confirmed','shipping','delivered','completed','cancelled') DEFAULT 'pending',
  `paymentMethod` enum('cod','vnpay') NOT NULL,
  `paymentStatus` enum('pending','paid','refunded') DEFAULT 'pending',
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `voucherId` int DEFAULT NULL,
  `discountAmount` decimal(10,2) DEFAULT '0.00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `voucherId` (`voucherId`),
  CONSTRAINT `orders_ibfk_10` FOREIGN KEY (`voucherId`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,5,730000.00,'confirmed','cod','refunded','56 Lý Tự Trọng, Quận 1, TP.HCM','0912345678',NULL,0.00,'2026-03-15 07:56:19','2026-03-15 07:58:50'),(2,6,270000.00,'confirmed','vnpay','paid','120 Pasteur, Quận 3, TP.HCM','0912345679',NULL,0.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(3,7,845000.00,'pending','cod','pending','88 Nguyễn Thị Thập, Quận 7, TP.HCM','0912345680',1,100000.00,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(4,1,700000.00,'pending','vnpay','pending','tttt','344343',NULL,0.00,'2026-03-15 08:02:19','2026-03-15 08:02:19'),(5,1,1190000.00,'cancelled','vnpay','paid','tttt','0987867676',NULL,0.00,'2026-03-15 08:06:41','2026-03-15 08:07:15'),(6,1,280000.00,'pending','cod','pending','111, Phường Cổ Nhuế 1, Quận Bắc Từ Liêm, Thành phố Hà Nội','0987878787',1,70000.00,'2026-03-15 08:36:29','2026-03-15 08:36:29'),(7,1,350000.00,'cancelled','vnpay','paid','111, Phường Cổ Nhuế 1, Quận Bắc Từ Liêm, Thành phố Hà Nội','0987878787',NULL,0.00,'2026-03-15 08:36:37','2026-03-15 08:44:49');
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
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `appointmentId` (`appointmentId`),
  CONSTRAINT `payments_ibfk_10` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_9` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,NULL,730000.00,'cod',NULL,'refunded',NULL,'2026-03-15 07:56:19','2026-03-15 07:58:50'),(2,2,NULL,270000.00,'vnpay','VNP14082726','success',NULL,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(3,5,NULL,1190000.00,'vnpay','15451256','success','{\"vnp_Amount\": \"119000000\", \"vnp_TxnRef\": \"5\", \"vnp_PayDate\": \"20260315150703\", \"vnp_TmnCode\": \"B77INC60\", \"vnp_BankCode\": \"NCB\", \"vnp_CardType\": \"ATM\", \"vnp_OrderInfo\": \"Thanh+toan+don+hang+5\", \"vnp_BankTranNo\": \"VNP15451256\", \"vnp_ResponseCode\": \"00\", \"vnp_TransactionNo\": \"15451256\", \"vnp_TransactionStatus\": \"00\"}','2026-03-15 08:07:07','2026-03-15 08:07:07'),(4,5,NULL,1190000.00,'vnpay','15451256','success','{\"vnp_Amount\": \"119000000\", \"vnp_TxnRef\": \"5\", \"vnp_PayDate\": \"20260315150703\", \"vnp_TmnCode\": \"B77INC60\", \"vnp_BankCode\": \"NCB\", \"vnp_CardType\": \"ATM\", \"vnp_OrderInfo\": \"Thanh+toan+don+hang+5\", \"vnp_BankTranNo\": \"VNP15451256\", \"vnp_ResponseCode\": \"00\", \"vnp_TransactionNo\": \"15451256\", \"vnp_TransactionStatus\": \"00\"}','2026-03-15 08:07:07','2026-03-15 08:07:07'),(5,7,NULL,350000.00,'vnpay','15451285','success','{\"vnp_Amount\": \"35000000\", \"vnp_TxnRef\": \"7\", \"vnp_PayDate\": \"20260315153655\", \"vnp_TmnCode\": \"B77INC60\", \"vnp_BankCode\": \"NCB\", \"vnp_CardType\": \"ATM\", \"vnp_OrderInfo\": \"Thanh+toan+don+hang+7\", \"vnp_BankTranNo\": \"VNP15451285\", \"vnp_ResponseCode\": \"00\", \"vnp_TransactionNo\": \"15451285\", \"vnp_TransactionStatus\": \"00\"}','2026-03-15 08:36:59','2026-03-15 08:36:59'),(6,7,NULL,350000.00,'vnpay','15451285','success','{\"vnp_Amount\": \"35000000\", \"vnp_TxnRef\": \"7\", \"vnp_PayDate\": \"20260315153655\", \"vnp_TmnCode\": \"B77INC60\", \"vnp_BankCode\": \"NCB\", \"vnp_CardType\": \"ATM\", \"vnp_OrderInfo\": \"Thanh+toan+don+hang+7\", \"vnp_BankTranNo\": \"VNP15451285\", \"vnp_ResponseCode\": \"00\", \"vnp_TransactionNo\": \"15451285\", \"vnp_TransactionStatus\": \"00\"}','2026-03-15 08:36:59','2026-03-15 08:36:59');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `productId` (`productId`),
  CONSTRAINT `product_reviews_ibfk_10` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `product_reviews_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (1,5,1,5,'Sáp Osis+ rất tốt, giữ nếp cả ngày, mùi thơm nhẹ.','2026-03-15 07:56:19','2026-03-15 07:56:19'),(2,5,3,4,'Pomade Reuzel Blue bóng đẹp, dễ gội sạch. Mùi hơi nồng.','2026-03-15 07:56:19','2026-03-15 07:56:19'),(3,6,6,5,'Dầu gội TRESemmé rất mượt, mùi thơm dịu. Dùng hoài không chán.','2026-03-15 07:56:19','2026-03-15 07:56:19'),(4,7,4,4,'Clay Baxter giữ nếp tốt nhưng hơi khó gội sạch.','2026-03-15 07:56:19','2026-03-15 07:56:19');
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
  `image` varchar(255) DEFAULT NULL,
  `categoryId` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Sáp vuốt tóc Osis+ Mess Up','Sáp vuốt tóc Schwarzkopf Osis+ Mess Up tạo kiểu matte finish, giữ nếp trung bình. Phù hợp tóc ngắn và trung bình.',350000.00,47,'https://www.planetbeauty.com/cdn/shop/files/Schwarzkopf_Professional_Osis_Mess_Up__4.jpg?v=1711485143',1,1,'2026-03-15 07:56:18','2026-03-15 08:44:49'),(2,'Sáp By Vilain Gold Digger','Sáp vuốt tóc By Vilain Gold Digger giữ nếp mạnh, matte finish tự nhiên. Hương thơm nam tính.',420000.00,35,'https://sgpomades.com/cdn/shop/files/By-Vilain-Gold-Digger-65ml-SGPomades-Discover-Joy-in-Self-Care-6677.jpg?v=1716970597',1,1,'2026-03-15 07:56:18','2026-03-15 08:07:15'),(3,'Pomade Reuzel Blue','Pomade gốc nước Reuzel Blue Strong Hold, bóng vừa, dễ gội sạch. Hương vanilla cola.',380000.00,40,'https://ishampoos.com/cdn/shop/files/reuzel-blue-pomade-strong-hold-water-soluble-113g4oz-852578006010.jpg?v=1773416233',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,'Clay Baxter of California','Sáp clay Baxter of California tạo kiểu matte, giữ nếp mạnh, phù hợp tóc dày.',550000.00,25,'https://www.apothecarie.com/cdn/shop/products/302-45834_7314a050-ba3a-4137-b488-b4d6122905a9.jpg?v=1662486112',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(5,'Wax Gatsby Moving Rubber','Gatsby Moving Rubber Spiky Edge, giữ nếp cứng, tạo kiểu tóc gai dễ dàng.',95000.00,100,'https://japanesetaste.com/cdn/shop/files/P-1-MND-WAX-SP-80-Mandom_Gatsby_Moving_Rubber_Hair_Wax_Spiky_Edge_80g_450x450.jpg?v=1743424944',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(6,'Dầu gội TRESemmé Keratin Smooth','Dầu gội TRESemmé Keratin Smooth giúp tóc suôn mượt, giảm xơ rối, chai 640ml.',155000.00,60,'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(7,'Dầu gội Head & Shoulders','Dầu gội Head & Shoulders sạch gàu, mát lạnh bạc hà, chai 625ml.',135000.00,80,'https://www.herbsdaily.com/cdn/shop/files/98316_a30e85f2-30aa-4711-9a82-07385c469c23.jpg?v=1751322089',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(8,'Dầu gội Moroccanoil','Dầu gội Moroccanoil Moisture Repair cho tóc hư tổn, chiết xuất dầu Argan, chai 250ml.',520000.00,20,'https://www.imagebeauty.com/cdn/shop/products/image-4.jpg?v=1642114070',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(9,'Dầu xả Dove Phục Hồi Hư Tổn','Dầu xả Dove Intensive Repair phục hồi tóc hư tổn, chai 620ml.',115000.00,70,'https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=600&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(10,'Serum dưỡng tóc Moroccanoil Treatment','Tinh dầu dưỡng tóc Moroccanoil Original Treatment, giúp tóc bóng mượt, giảm xơ, 100ml.',780000.00,15,'https://livelovespa.com/cdn/shop/files/Untitleddesign-2023-08-17T161533.454.png?v=1692314178',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(11,'Xịt dưỡng tóc Mise en Scene','Xịt dưỡng tóc Mise en Scene Perfect Serum Mist, dưỡng ẩm không gây bết, 150ml.',165000.00,45,'https://www.masksheets.com/cdn/shop/files/newitem-2025-11-11T120533.889.png?v=1762881026',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(12,'Tinh dầu Argan L\'Oréal','Tinh dầu dưỡng tóc L\'Oréal Extraordinary Oil chiết xuất Argan, 100ml.',220000.00,30,'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&h=600&fit=crop',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(13,'Máy sấy tóc Panasonic EH-ND65','Máy sấy tóc Panasonic 2000W, 3 chế độ nhiệt, ion dưỡng tóc.',650000.00,15,'https://www.esh2u.com/cdn/shop/files/2_d6a358d6-7fe3-4b6c-8c23-cdce405d2f09.png?v=1730880811',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(14,'Máy uốn tóc Philips BHB862','Máy uốn tóc Philips StyleCare, thanh uốn 25mm, lớp phủ Ceramic.',490000.00,10,'https://gandhiappliances.com/cdn/shop/products/eh-na-65-k_1024x.jpg?v=1608492995',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(15,'Lược chải tóc Tangle Teezer','Lược gỡ rối Tangle Teezer Original, chải tóc không đau, phù hợp mọi loại tóc.',280000.00,40,'https://us.tangleteezer.com/cdn/shop/files/PinkFizz_OR_PDP_1.png?v=1762110971',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(16,'tt','tt',12000.00,12,'https://res.cloudinary.com/daytrfyrg/image/upload/v1773561550/salon_hub/w6pj1k9nsmpej1asvear.jpg',2,1,'2026-03-15 07:59:11','2026-03-15 07:59:11');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `staffId` (`staffId`),
  KEY `appointmentId` (`appointmentId`),
  CONSTRAINT `reviews_ibfk_13` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_14` FOREIGN KEY (`staffId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_15` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,5,2,1,5,'Anh Tuấn cắt rất đẹp, đúng ý mình. Sẽ quay lại!','2026-03-15 07:56:19','2026-03-15 07:56:19'),(2,5,2,2,4,'Uốn đẹp lắm, hơi lâu một chút nhưng kết quả rất ưng.','2026-03-15 07:56:19','2026-03-15 07:56:19');
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
INSERT INTO `services` VALUES (1,'Cắt tóc nam cơ bản','Cắt tóc nam theo yêu cầu, bao gồm gội và sấy tạo kiểu',80000.00,30,'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(2,'Cắt tóc nam cao cấp','Cắt tóc nam với stylist chuyên nghiệp, tư vấn kiểu phù hợp khuôn mặt',150000.00,45,'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,'Cắt tóc nữ ngắn','Cắt tóc nữ ngắn thời trang, bao gồm gội sấy',120000.00,40,'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,'Cắt tóc nữ dài','Cắt tỉa, tạo kiểu tóc dài, bao gồm gội sấy tạo kiểu',180000.00,60,'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',1,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(5,'Uốn tóc nam Hàn Quốc','Uốn tóc nam kiểu Hàn Quốc tự nhiên, giữ nếp lâu 3-6 tháng',350000.00,90,'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(6,'Uốn tóc nữ lọn lớn','Uốn tóc nữ sóng lọn lớn bồng bềnh, sử dụng thuốc uốn cao cấp',500000.00,120,'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(7,'Uốn phồng chân tóc','Uốn phồng chân tóc tạo độ bồng tự nhiên',300000.00,60,'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop',2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(8,'Nhuộm tóc thời trang','Nhuộm tóc màu thời trang (nâu, vàng, đỏ, highlight...)',400000.00,90,'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(9,'Nhuộm phủ bạc','Nhuộm tóc phủ bạc với màu tự nhiên, an toàn cho da đầu',250000.00,60,'https://images.unsplash.com/photo-1560869713-bf165a3b2c81?w=800&h=600&fit=crop',3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(10,'Phục hồi tóc Keratin','Phục hồi tóc hư tổn bằng Keratin cao cấp, tóc mềm mượt tức thì',600000.00,90,'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800&h=600&fit=crop',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(11,'Hấp dầu phục hồi','Hấp dầu dưỡng tóc sâu, phục hồi tóc khô xơ',200000.00,45,'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&h=600&fit=crop',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(12,'Ủ tóc Collagen','Ủ tóc Collagen giúp tóc chắc khỏe, bóng mượt từ gốc đến ngọn',350000.00,60,'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&h=600&fit=crop',4,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(13,'Gội đầu dưỡng sinh','Gội đầu kết hợp massage đầu cổ vai gáy thư giãn',70000.00,30,'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',5,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(14,'Gội massage combo','Gội đầu + massage đầu + massage mặt + đắp mặt nạ',150000.00,45,'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',5,1,'2026-03-15 07:56:18','2026-03-15 07:56:18');
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
  CONSTRAINT `staff_schedules_ibfk_10` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `staff_schedules_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_schedules`
--

LOCK TABLES `staff_schedules` WRITE;
/*!40000 ALTER TABLE `staff_schedules` DISABLE KEYS */;
INSERT INTO `staff_schedules` VALUES (1,2,1,1,'08:00','17:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(2,3,1,1,'09:00','18:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,4,2,1,'08:30','17:30','2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,2,1,2,'08:00','17:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(5,3,1,2,'09:00','18:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(6,4,2,2,'08:30','17:30','2026-03-15 07:56:18','2026-03-15 07:56:18'),(7,2,1,3,'08:00','17:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(8,3,1,3,'09:00','18:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(9,4,2,3,'08:30','17:30','2026-03-15 07:56:18','2026-03-15 07:56:18'),(10,2,1,4,'08:00','17:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(11,3,1,4,'09:00','18:00','2026-03-15 07:56:18','2026-03-15 07:56:18'),(12,4,2,4,'08:30','17:30','2026-03-15 07:56:19','2026-03-15 07:56:19'),(13,2,1,5,'08:00','17:00','2026-03-15 07:56:19','2026-03-15 07:56:19'),(14,3,1,5,'09:00','18:00','2026-03-15 07:56:19','2026-03-15 07:56:19'),(15,4,2,5,'08:30','17:30','2026-03-15 07:56:19','2026-03-15 07:56:19'),(16,2,1,6,'08:00','14:00','2026-03-15 07:56:19','2026-03-15 07:56:19'),(17,3,1,6,'09:00','15:00','2026-03-15 07:56:19','2026-03-15 07:56:19'),(18,4,2,6,'08:30','14:30','2026-03-15 07:56:19','2026-03-15 07:56:19');
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
  CONSTRAINT `staff_skills_ibfk_10` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `staff_skills_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_skills`
--

LOCK TABLES `staff_skills` WRITE;
/*!40000 ALTER TABLE `staff_skills` DISABLE KEYS */;
INSERT INTO `staff_skills` VALUES (1,2,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(2,2,2,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,2,5,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,2,13,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(5,3,1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(6,3,3,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(7,3,8,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(8,3,9,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(9,3,10,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(10,4,3,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(11,4,4,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(12,4,6,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(13,4,7,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(14,4,8,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(15,4,11,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(16,4,12,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(17,4,14,'2026-03-15 07:56:18','2026-03-15 07:56:18');
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
  `role` enum('customer','staff','admin') DEFAULT 'customer',
  `branchId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
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
  KEY `branchId` (`branchId`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Nguyễn Văn Admin','admin@salonhub.vn','$2b$10$xpcz.ixQJl.NA6ncZFNcR.TiOoAfvx553zP9xqZTO428GG8Ue4J0i','0901000001','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face','admin',NULL,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(2,'Trần Minh Tuấn','tuan@salonhub.vn','$2b$10$xpcz.ixQJl.NA6ncZFNcR.TiOoAfvx553zP9xqZTO428GG8Ue4J0i','0901000002','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face','staff',1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(3,'Lê Hoàng Nam','nam@salonhub.vn','$2b$10$xpcz.ixQJl.NA6ncZFNcR.TiOoAfvx553zP9xqZTO428GG8Ue4J0i','0901000003','https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face','staff',1,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(4,'Phạm Thị Mai','mai@salonhub.vn','$2b$10$xpcz.ixQJl.NA6ncZFNcR.TiOoAfvx553zP9xqZTO428GG8Ue4J0i','0901000004','https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face','staff',2,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(5,'Võ Thanh Hùng','hung@gmail.com','$2b$10$xpcz.ixQJl.NA6ncZFNcR.TiOoAfvx553zP9xqZTO428GG8Ue4J0i','0912345678','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face','customer',NULL,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(6,'Nguyễn Thị Lan','lan@gmail.com','$2b$10$xpcz.ixQJl.NA6ncZFNcR.TiOoAfvx553zP9xqZTO428GG8Ue4J0i','0912345679','https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face','customer',NULL,'2026-03-15 07:56:18','2026-03-15 07:56:18'),(7,'Đặng Quốc Bảo','bao@gmail.com','$2b$10$xpcz.ixQJl.NA6ncZFNcR.TiOoAfvx553zP9xqZTO428GG8Ue4J0i','0912345680','https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face','customer',NULL,'2026-03-15 07:56:18','2026-03-15 07:56:18');
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
  UNIQUE KEY `code_5` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'CHAOBAN',20.00,'percent',200000.00,100000.00,'2026-01-01','2026-12-31',500,1,1,'2026-03-15 07:56:19','2026-03-15 08:36:29'),(2,'GIAM50K',50000.00,'fixed',300000.00,50000.00,'2026-01-01','2026-06-30',200,0,1,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(3,'SUMMER30',30.00,'percent',500000.00,200000.00,'2026-06-01','2026-08-31',100,0,1,'2026-03-15 07:56:19','2026-03-15 07:56:19'),(4,'FREESHIP',30000.00,'fixed',0.00,30000.00,'2026-01-01','2026-12-31',1000,0,1,'2026-03-15 07:56:19','2026-03-15 07:56:19');
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

-- Dump completed on 2026-03-16 13:06:13
