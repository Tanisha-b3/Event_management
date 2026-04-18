locals {
   name_prefix = "${var.project_name}-${var.environment}"
 }

 # VPC
 resource "aws_vpc" "main" {
   cidr_block           = var.vpc_cidr
   enable_dns_hostnames = true
   enable_dns_support   = true

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-vpc"
   })
 }

 # Internet Gateway
 resource "aws_internet_gateway" "main" {
   vpc_id = aws_vpc.main.id

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-igw"
   })
 }

 # Public Subnets
 resource "aws_subnet" "public" {
   count             = length(var.public_subnet_cidrs)
   vpc_id            = aws_vpc.main.id
   cidr_block        = var.public_subnet_cidrs[count.index]
   availability_zone = var.availability_zones[count.index]
   map_public_ip_on_launch = true

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
   })
 }

 # Private Subnets
 resource "aws_subnet" "private" {
   count             = length(var.private_subnet_cidrs)
   vpc_id            = aws_vpc.main.id
   cidr_block        = var.private_subnet_cidrs[count.index]
   availability_zone = var.availability_zones[count.index]

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
   })
 }

 # Elastic IP for NAT Gateway
 resource "aws_eip" "nat" {
   count  = var.enable_nat_gateway ? 1 : 0
   domain = "vpc"

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-nat-eip"
   })
 }

 # NAT Gateway
 resource "aws_nat_gateway" "main" {
   count         = var.enable_nat_gateway ? 1 : 0
   allocation_id = aws_eip.nat[0].id
   subnet_id     = aws_subnet.public[0].id

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-nat-gw"
   })

   depends_on = [aws_internet_gateway.main]
 }

 # Route Table for Public Subnets
 resource "aws_route_table" "public" {
   vpc_id = aws_vpc.main.id

   route {
     cidr_block = "0.0.0.0/0"
     gateway_id = aws_internet_gateway.main.id
   }

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-public-rt"
   })
 }

 # Route Table for Private Subnets
 resource "aws_route_table" "private" {
   count  = var.enable_nat_gateway ? 1 : 0
   vpc_id = aws_vpc.main.id

   route {
     cidr_block     = "0.0.0.0/0"
     nat_gateway_id = aws_nat_gateway.main[0].id
   }

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-private-rt"
   })
 }

 # Associate Public Subnets with Public Route Table
 resource "aws_route_table_association" "public" {
   count          = length(aws_subnet.public)
   subnet_id     = aws_subnet.public[count.index].id
   route_table_id = aws_route_table.public.id
 }

 # Associate Private Subnets with Private Route Table
 resource "aws_route_table_association" "private" {
   count          = length(aws_subnet.private)
   subnet_id     = aws_subnet.private[count.index].id
   route_table_id = aws_route_table.private[0].id
 }

 # Security Group for EC2
 resource "aws_security_group" "ec2" {
   name        = "${local.name_prefix}-ec2-sg"
   description = "Security group for EC2 instances"
   vpc_id     = aws_vpc.main.id

   ingress {
     from_port   = 22
     to_port     = 22
     protocol    = "tcp"
     cidr_blocks = ["0.0.0.0/0"]
     description = "SSH"
   }

   ingress {
     from_port   = 80
     to_port     = 80
     protocol    = "tcp"
     cidr_blocks = ["0.0.0.0/0"]
     description = "HTTP"
   }

   ingress {
     from_port   = 443
     to_port     = 443
     protocol    = "tcp"
     cidr_blocks = ["0.0.0.0/0"]
     description = "HTTPS"
   }

   egress {
     from_port   = 0
     to_port     = 0
     protocol    = "-1"
     cidr_blocks = ["0.0.0.0/0"]
   }

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-ec2-sg"
   })
 }

 # Security Group for ALB
 resource "aws_security_group" "alb" {
   name        = "${local.name_prefix}-alb-sg"
   description = "Security group for Application Load Balancer"
   vpc_id     = aws_vpc.main.id

   ingress {
     from_port   = 80
     to_port     = 80
     protocol    = "tcp"
     cidr_blocks = ["0.0.0.0/0"]
     description = "HTTP"
   }

   ingress {
     from_port   = 443
     to_port     = 443
     protocol    = "tcp"
     cidr_blocks = ["0.0.0.0/0"]
     description = "HTTPS"
   }

   egress {
     from_port   = 0
     to_port     = 0
     protocol    = "-1"
     cidr_blocks = ["0.0.0.0/0"]
   }

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-alb-sg"
   })
 }

 # IAM Role for EC2
 resource "aws_iam_role" "ec2" {
   name = "${local.name_prefix}-ec2-role"
   assume_role_policy = jsonencode({
     Version = "2012-10-17"
     Statement = [{
       Action = "sts:AssumeRole"
       Effect = "Allow"
       Principal = {
         Service = "ec2.amazonaws.com"
       }
     }]
   })

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-ec2-role"
   })
 }

 # IAM Instance Profile
 resource "aws_iam_instance_profile" "ec2" {
   name = "${local.name_prefix}-ec2-profile"
   role = aws_iam_role.ec2.name

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-ec2-profile"
   })
 }

 # Key Pair
 resource "aws_key_pair" "deployer" {
   key_name   = "${local.name_prefix}-key"
   public_key = var.ssh_public_key

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-key"
   })
 }

 # EC2 Instances
 resource "aws_instance" "app" {
   count         = var.instance_count
   ami           = var.ami_id
   instance_type = var.instance_type
   subnet_id     = aws_subnet.private[count.index % length(aws_subnet.private)].id
   key_name     = aws_key_pair.deployer.key_name

   vpc_security_group_ids = [aws_security_group.ec2.id]

   iam_instance_profile = aws_iam_instance_profile.ec2.name

   user_data = base64encode(templatefile("${path.module}/userdata.sh", {
     environment = var.environment
   }))

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-app-${count.index + 1}"
   })
 }

 # Application Load Balancer
 resource "aws_lb" "main" {
   name               = "${local.name_prefix}-alb"
   internal           = false
   load_balancer_type = "application"
   security_groups   = [aws_security_group.alb.id]
   subnets           = aws_subnet.public[*].id

   enable_deletion_protection = false

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-alb"
   })
 }

 # ALB Target Group
 resource "aws_lb_target_group" "main" {
   name     = "${local.name_prefix}-tg"
   port     = 80
   protocol = "HTTP"
   vpc_id   = aws_vpc.main.id

   health_check {
     enabled             = true
     healthy_threshold   = 2
     interval            = 30
     matcher             = "200"
     path                = "/health"
     protocol            = "HTTP"
     timeout             = 5
     unhealthy_threshold = 2
   }

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-tg"
   })
 }

 # ALB Listener
 resource "aws_lb_listener" "front_end" {
   load_balancer_arn = aws_lb.main.arn
   port            = "80"
   protocol       = "HTTP"

   default_action {
     type             = "forward"
     target_group_arn = aws_lb_target_group.main.arn
   }
 }

 # ALB Target Group Attachment
 resource "aws_lb_target_group_attachment" "app" {
   count = var.instance_count
   target_group_arn = aws_lb_target_group.main.arn
   target_id     = aws_instance.app[count.index].id
   port         = 80
 }

 # VPC Flow Logs (optional)
 resource "aws_flow_log" "main" {
   count  = var.enable_flow_logs ? 1 : 0
   log_destination_type = "cloud-watch-logs"
   log_group_name     = "${local.name_prefix}-flow-logs"
   vpc_id            = aws_vpc.main.id
   traffic_type      = "ACCEPT"

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-flow-logs"
   })
 }

 # CloudWatch Log Group
 resource "aws_cloudwatch_log_group" "flow_logs" {
   count = var.enable_flow_logs ? 1 : 0
   name  = "${local.name_prefix}-flow-logs"

   retention_in_days = 7

   tags = merge(var.tags, {
     Name = "${local.name_prefix}-flow-logs"
   })
 }

 # IAM Role for Flow Logs
 resource "aws_iam_role" "flow_logs" {
   count = var.enable_flow_logs ? 1 : 0
   name  = "${local.name_prefix}-flow-logs-role"
   assume_role_policy = jsonencode({
     Version = "2012-10-17"
     Statement = [{
       Action = "sts:AssumeRole"
       Effect = "Allow"
       Principal = {
         Service = "vpc-flow-logs.amazonaws.com"
       }
     }]
   })
 }

 # IAM Policy for Flow Logs
 resource "aws_iam_role_policy" "flow_logs" {
   count = var.enable_flow_logs ? 1 : 0
   name  = "${local.name_prefix}-flow-logs-policy"
   role  = aws_iam_role.flow_logs[0].id
   policy = jsonencode({
     Version = "2012-10-17"
     Statement = [{
       Effect = "Allow"
       Action = ["logs:CreateLogStream", "logs:PutLogEvents"]
       Resource = "*"
     }]
   })
 }