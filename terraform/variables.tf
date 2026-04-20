variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "event-management"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 1
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Default tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project    = "event-management"
    ManagedBy = "Terraform"
  }
}

variable "ami_id" {
  description = "AMI ID for EC2 instances (default: Amazon Linux 2)"
  type        = string
  default     = "ami-0c55b159cbfafe1f0"
}

variable "ssh_public_key" {
  description = "SSH public key for key pair"
  type        = string
  default     = ""
}

variable "key_name" {}

variable "repo_url" {
  default = "https://github.com/Tanisha-b3/Event_management.git"
}

# Backend ENV
variable "mongo_uri" {}
variable "jwt_secret" {}
variable "access_token_secret" {}
variable "refresh_token_secret" {}
variable "google_client_id" {}
variable "client_secret" {}
variable "email" {}
variable "twilio_sid" {}
variable "twilio_token" {}
variable "twilio_number" {}
variable "groq_api_key" {}
variable "VITE_GOOGLE_CLIENT_ID" {}
