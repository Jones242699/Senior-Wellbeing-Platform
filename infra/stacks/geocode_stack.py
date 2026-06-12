from aws_cdk import (
    Duration,
    Stack,
    aws_lambda as lambda_,
)
from aws_cdk import aws_apigatewayv2 as apigwv2
from aws_cdk import aws_apigatewayv2_integrations as integrations
from constructs import Construct


class GeocodeStack(Stack):

    def __init__(self, scope: Construct, id: str, api: apigwv2.HttpApi, **kwargs):
        super().__init__(scope, id, **kwargs)

        geocode_search_function = lambda_.Function(
            self,
            "GeocodeSearchFunction",
            function_name="swp-geocodeSearch",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="lambda_function.lambda_handler",
            code=lambda_.Code.from_asset("../backend/geocode"),
            timeout=Duration.seconds(10),
            memory_size=128,
        )

        integration = integrations.HttpLambdaIntegration(
            "GeocodeSearchIntegration",
            geocode_search_function,
        )

        api.add_routes(
            path="/geocode/search",
            methods=[apigwv2.HttpMethod.GET],
            integration=integration,
        )
