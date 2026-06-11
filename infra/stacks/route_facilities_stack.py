from aws_cdk import (
    Duration,
    Stack,
    aws_lambda as lambda_,
)
from aws_cdk import aws_apigatewayv2 as apigwv2
from aws_cdk import aws_apigatewayv2_integrations as integrations
from constructs import Construct


class RouteFacilitiesStack(Stack):

    def __init__(self, scope: Construct, id: str, api: apigwv2.HttpApi, **kwargs):
        super().__init__(scope, id, **kwargs)

        get_route_facilities = lambda_.Function(
            self,
            "GetRouteFacilitiesFunction",
            function_name="swp-getRouteFacilities",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="lambda_function.lambda_handler",
            code=lambda_.Code.from_asset("../backend/route-facilities"),
            timeout=Duration.seconds(10),
            memory_size=256,
            environment={
                "DB_HOST": "elderly-loneliness-database.c58eaa0yqnag.ap-southeast-2.rds.amazonaws.com",
                "DB_NAME": "postgres",
                "DB_USER": "postgres",
                "DB_PASSWORD": "fit5120te28",
            },
            layers=[
                lambda_.LayerVersion.from_layer_version_arn(
                    self,
                    "Psycopg2LayerRouteFacilities",
                    "arn:aws:lambda:ap-southeast-2:021104859098:layer:psycopg2:2",
                )
            ],
        )

        integration = integrations.HttpLambdaIntegration(
            "RouteFacilitiesIntegration",
            get_route_facilities,
        )

        api.add_routes(
            path="/route-facilities",
            methods=[apigwv2.HttpMethod.POST],
            integration=integration,
        )
