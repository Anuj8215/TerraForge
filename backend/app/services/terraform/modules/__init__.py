from app.services.terraform.modules import ec2, s3, vpc

GENERATORS = {
    "ec2": ec2.generate,
    "s3": s3.generate,
    "vpc": vpc.generate,
}
