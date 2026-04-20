variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "eventpro"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

variable "ecs_cluster_min_size" {
  description = "ECS cluster minimum size"
  type        = number
  default     = 1
}

variable "ecs_cluster_max_size" {
  description = "ECS cluster maximum size"
  type        = number
  default     = 4
}

variable "ecs_cluster_desired_capacity" {
  description = "ECS cluster desired capacity"
  type        = number
  default     = 2
}

variable "frontend_docker_image" {
  description = "Frontend Docker image URL"
  type        = string
  default     = ""
}

variable "backend_docker_image" {
  description = "Backend Docker image URL"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_100, PriceClass_200, or PriceClass_All)"
  type        = string
  default     = "PriceClass_100"
}

variable "domain_name" {
  description = "Domain name for CloudFront"
  type        = string
  default     = ""
}

variable "allowed_cidr" {
  description = "Allowed CIDR for SSH access"
  type        = string
  default     = "0.0.0.0/0"
}