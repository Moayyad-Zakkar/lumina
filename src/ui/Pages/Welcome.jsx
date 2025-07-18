import React from 'react';
import { IconWithBackground } from '../../ui/components/IconWithBackground';
import { Button } from '../../ui/components/Button';
import { FeatherArrowRight } from '@subframe/core';
import { Link } from 'react-router';

function Welcome() {
  return (
    <div className="container h-screen max-w-none flex w-full flex-col items-center justify-center bg-default-background py-12">
      <div className="flex w-full max-w-[576px] flex-col items-center justify-center gap-6">
        <IconWithBackground variant="success" size="x-large" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-heading-1 font-heading-1 text-default-font">
            Welcome! You&#39;re all set.
          </span>
          <span className="text-body font-body text-subtext-color text-center">
            Thank you for registering. Your account has been successfully
            created.
          </span>
        </div>
        <Link to="/login">
          <Button size="large" iconRight={<FeatherArrowRight />}>
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Welcome;
