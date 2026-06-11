import os
import aws_cdk as cdk
from stacks.api_stack import ApiStack
from stacks.places_stack import PlacesStack
from stacks.counseling_stack import CounselingStack
from stacks.benches_stack import BenchesStack
from stacks.pedestrian_score_stack import PedestrianScoreStack
from stacks.shade_score_stack import ShadeScoreStack
from stacks.routes_stack import RoutesStack
from stacks.route_facilities_stack import RouteFacilitiesStack
from stacks.venues_stack import VenuesStack
from stacks.crowd_density_stack import CrowdDensityStack
from stacks.events_stack import EventsStack

PROJECT_STACK_PREFIX = "SWP"
DEFAULT_API_BASE_URL = "https://k2algu70g6.execute-api.ap-southeast-2.amazonaws.com"


app = cdk.App()

#  define unique environment
env = cdk.Environment(
    account=os.getenv("CDK_DEFAULT_ACCOUNT"),
    region="ap-southeast-2"
)

#  create API Stack
api_stack = ApiStack(
    app,
    f"{PROJECT_STACK_PREFIX}ApiStack",
    env=env
)

#  create Places Stack
PlacesStack(
    app,
    f"{PROJECT_STACK_PREFIX}PlacesStack",
    api=api_stack.api,
    env=env
)

CounselingStack(
    app,
    f"{PROJECT_STACK_PREFIX}CounselingStack",
    api=api_stack.api,
    env=env
)

BenchesStack(
    app,
    f"{PROJECT_STACK_PREFIX}BenchesStack",
    api=api_stack.api,
    env=env
)

PedestrianScoreStack(
    app,
    f"{PROJECT_STACK_PREFIX}PedestrianScoreStack",
    api=api_stack.api,
    env=env
)

ShadeScoreStack(
    app,
    f"{PROJECT_STACK_PREFIX}ShadeScoreStack",
    api=api_stack.api,
    env=env
)

RoutesStack(
    app,
    f"{PROJECT_STACK_PREFIX}RoutesStack",
    api=api_stack.api,
    api_base_url=os.getenv("SWP_API_BASE_URL", DEFAULT_API_BASE_URL),
    env=env
)

RouteFacilitiesStack(
    app,
    f"{PROJECT_STACK_PREFIX}RouteFacilitiesStack",
    api=api_stack.api,
    env=env
)

VenuesStack(
    app,
    f"{PROJECT_STACK_PREFIX}VenuesStack",
    api=api_stack.api,
    env=env
)

CrowdDensityStack(
    app,
    f"{PROJECT_STACK_PREFIX}CrowdDensityStack",
    api=api_stack.api,
    env=env
)

EventsStack(
    app,
    f"{PROJECT_STACK_PREFIX}EventsStack",
    api=api_stack.api,
    env=env
)

app.synth()
