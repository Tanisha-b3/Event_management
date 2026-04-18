output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public Subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private Subnet IDs"
  value       = aws_subnet.private[*].id
}

output "security_group_ec2_id" {
  description = "EC2 Security Group ID"
  value       = aws_security_group.ec2.id
}

output "security_group_alb_id" {
  description = "ALB Security Group ID"
  value       = aws_security_group.alb.id
}

output "instance_ids" {
  description = "EC2 Instance IDs"
  value       = aws_instance.app[*].id
}

output "instance_private_ips" {
  description = "EC2 Instance Private IPs"
  value       = aws_instance.app[*].private_ip
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS Name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "Target Group ARN"
  value       = aws_lb_target_group.main.arn
}