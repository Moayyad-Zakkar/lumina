import React from 'react';

import { Button } from '../../ui/components/Button';
import { IconWithBackground } from '../../ui/components/IconWithBackground';
import { FeatherLandmark } from '@subframe/core';
import { FeatherCheckCircle2 } from '@subframe/core';
import { FeatherShield } from '@subframe/core';
import { BoldFooter } from '../../ui/components/BoldFooter';
import FeaturesShowCase from '../components/FeaturesShowCase';

function Home() {
  return (
    <div>
      <div className="flex w-full flex-col items-center justify-center gap-8 bg-default-background px-6 pt-40 pb-24">
        <span className="max-w-[1024px] whitespace-pre-wrap font-['Montserrat'] text-[85px] font-[200] leading-[84px] text-default-font text-center -tracking-[0.04em] mobile:font-['Montserrat'] mobile:text-[62px] mobile:font-[900] mobile:leading-[58px] mobile:tracking-normal">
          {'Digital Aligners. Real Results. Trusted by Professionals.'}
        </span>
        <span className="max-w-[576px] whitespace-pre-wrap font-['Montserrat'] text-[20px] font-[500] leading-[28px] text-subtext-color text-center -tracking-[0.015em]">
          {
            'Lumina is your dedicated partner in manufacturing custom orthodontic aligners with speed, accuracy, and care. Fully digital. Fully scalable. Fully dependable.'
          }
        </span>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Button size="large">Join today</Button>
          <Button variant="neutral-tertiary" size="large">
            How it works
          </Button>
        </div>
      </div>
      <div className="flex w-full flex-col items-center bg-default-background px-6 py-24">
        <img
          className="h-144 w-full max-w-[1280px] flex-none object-cover"
          src="https://res.cloudinary.com/subframe/image/upload/v1724690087/uploads/302/w2ra2yihpofsdy1h4uhy.png"
        />
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-2 bg-brand-300 px-6 py-24">
        <div className="flex w-full max-w-[1280px] grow shrink-0 basis-0 flex-wrap items-center justify-center gap-12">
          <div className="flex min-w-[320px] grow shrink-0 basis-0 flex-col items-center justify-center gap-10 self-stretch">
            <div className="flex w-full max-w-[576px] flex-col items-start justify-center gap-10">
              <div className="flex flex-col items-start justify-center gap-4">
                <span className="font-['Montserrat'] text-[30px] font-[700] leading-[34px] text-default-font -tracking-[0.025em]">
                  Warp-speed, anti-matter transmissions
                </span>
                <span className="whitespace-pre-wrap font-['Montserrat'] text-[18px] font-[400] leading-[26px] text-default-font -tracking-[0.01em]">
                  {
                    "Plunge into our hyperdimensional currency nexus. FinEdge's tachyon-powered network catapults 80% of transfers across galaxies in mere nanoseconds. It's not just rapid—it's chronological displacement for your cosmic capital."
                  }
                </span>
              </div>
              <Button variant="brand-secondary" size="large">
                Send your first transaction
              </Button>
            </div>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch">
            <div className="flex h-144 w-full min-w-[240px] max-w-[576px] flex-none flex-col items-center justify-center gap-2 overflow-hidden">
              <img
                className="w-full grow shrink-0 basis-0 object-cover"
                src="https://res.cloudinary.com/subframe/image/upload/v1724705524/uploads/302/l5oq75rpdkq2kowa2xkj.png"
              />
            </div>
          </div>
        </div>
      </div>
      <FeaturesShowCase />
      <div className="flex w-full flex-col items-center justify-center gap-6 bg-default-background px-6 py-24">
        <div className="flex w-full max-w-[1280px] grow shrink-0 basis-0 flex-wrap items-center justify-center gap-12">
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch">
            <div className="flex h-144 w-full min-w-[240px] max-w-[576px] flex-none flex-col items-center justify-center gap-2 overflow-hidden">
              <img
                className="w-full grow shrink-0 basis-0 object-cover"
                src="https://res.cloudinary.com/subframe/image/upload/v1724690133/uploads/302/tswlwr0qfwwhkgbjwplw.png"
              />
            </div>
          </div>
          <div className="flex min-w-[320px] grow shrink-0 basis-0 flex-col items-start justify-center gap-10 self-stretch">
            <div className="flex max-w-[448px] flex-col items-start justify-center gap-4">
              <span className="font-['Montserrat'] text-[30px] font-[700] leading-[34px] text-default-font -tracking-[0.025em]">
                Your galactic financial nexus, bridging star systems
              </span>
              <span className="whitespace-pre-wrap font-['Montserrat'] text-[18px] font-[400] leading-[26px] text-subtext-color -tracking-[0.01em]">
                {
                  'Conduct your cosmic capital symphony from a singular, harmonious astro-platform. Effortlessly beam quantum support to your clan, orchestrate interstellar credit concertos, or warp funds to your FinEdge quantum vault from any sector of the known universe.'
                }
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="large">Initiate quantum account</Button>
              <Button variant="neutral-tertiary" size="large">
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-6 bg-default-background px-6 py-24">
        <div className="flex w-full max-w-[1280px] grow shrink-0 basis-0 flex-wrap items-center justify-center gap-12">
          <div className="flex min-w-[320px] grow shrink-0 basis-0 flex-col items-start justify-center gap-10 self-stretch">
            <div className="flex max-w-[448px] flex-col items-start justify-center gap-4">
              <span className="font-['Montserrat'] text-[30px] font-[700] leading-[34px] text-default-font -tracking-[0.025em]">
                Hypercharge your cosmic credits: 5.25% Quantum Yield
              </span>
              <span className="whitespace-pre-wrap font-['Montserrat'] text-[18px] font-[400] leading-[26px] text-subtext-color -tracking-[0.01em]">
                {
                  'Witness your galactic balance achieve escape velocity with our stellar 5.25% Annual Quantum Yield. Activate our hyperdrive savings boosters and watch your assets transcend light speed. Your cosmic wealth remains as accessible as your nearest wormhol.'
                }
              </span>
            </div>
            <Button size="large">Explore quantum yield</Button>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch">
            <div className="flex h-144 w-full min-w-[240px] max-w-[576px] flex-none flex-col items-center justify-center gap-2 overflow-hidden">
              <img
                className="w-full grow shrink-0 basis-0 object-cover"
                src="https://res.cloudinary.com/subframe/image/upload/v1724690142/uploads/302/fbkapcq4o1zsq98df0t6.png"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-6 py-24">
        <div className="flex h-px w-full max-w-[1280px] flex-none flex-col items-center gap-2 bg-neutral-border" />
      </div>
      <div className="flex w-full grow shrink-0 basis-0 items-center justify-center gap-4 px-6 py-24">
        <div className="flex max-w-[1280px] grow shrink-0 basis-0 flex-wrap items-center justify-center gap-12">
          <div className="flex min-w-[240px] grow shrink-0 basis-0 items-center gap-4">
            <IconWithBackground size="x-large" icon={<FeatherLandmark />} />
            <span className="font-['Montserrat'] text-[16px] font-[500] leading-[24px] text-default-font -tracking-[0.01em]">
              All cosmic assets securely stored in neutron vaults
            </span>
          </div>
          <div className="flex min-w-[240px] grow shrink-0 basis-0 items-center gap-4">
            <IconWithBackground size="x-large" icon={<FeatherCheckCircle2 />} />
            <span className="font-['Montserrat'] text-[16px] font-[500] leading-[24px] text-default-font -tracking-[0.01em]">
              Certified and compliant with intergalactic protocols
            </span>
          </div>
          <div className="flex min-w-[240px] grow shrink-0 basis-0 items-center gap-4">
            <IconWithBackground size="x-large" icon={<FeatherShield />} />
            <span className="font-['Montserrat'] text-[16px] font-[500] leading-[24px] text-default-font -tracking-[0.01em]">
              Regulated and licensed across all star systems
            </span>
          </div>
        </div>
      </div>
      <div className="flex w-full grow shrink-0 basis-0 flex-col items-center justify-center gap-2 px-6 py-24">
        <div className="flex w-full max-w-[1280px] flex-wrap items-center justify-center gap-6 rounded-[32px] bg-brand-200 px-12 py-28 mobile:px-6 mobile:py-28">
          <div className="flex min-w-[240px] max-w-[576px] grow shrink-0 basis-0 flex-col items-start gap-8 px-8 mobile:px-0 mobile:py-0">
            <span className="font-['Montserrat'] text-[50px] font-[700] leading-[56px] text-default-font -tracking-[0.025em] mobile:font-['Montserrat'] mobile:text-[40px] mobile:font-[700] mobile:leading-[40px] mobile:tracking-normal">
              Forge your financial future
            </span>
            <span className="w-full max-w-[448px] whitespace-pre-wrap font-['Montserrat'] text-[18px] font-[400] leading-[26px] text-default-font -tracking-[0.01em]">
              {
                'Every quark of the 11 billion galactic credits we safeguard monthly is shielded by quantum barriers. Our hyperdimensional encryption serves as your cloaking device, while multi-factor authentication acts as your personal AI sentinel.\n\nOur vigilant legion of interstellar customer service agents stands at the ready. Should you require backup, our elite anti-fraud squadrons and security task forces are poised to defend your financial nebula.'
              }
            </span>
            <Button variant="brand-secondary" size="large">
              Redeem galactic credits
            </Button>
          </div>
          <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch overflow-hidden">
            <img
              className="w-full grow shrink-0 basis-0 rounded-lg object-cover"
              src="https://res.cloudinary.com/subframe/image/upload/v1724690087/uploads/302/w2ra2yihpofsdy1h4uhy.png"
            />
          </div>
        </div>
      </div>
      <div className="flex w-full grow shrink-0 basis-0 flex-col items-center justify-center gap-2 bg-brand-900 px-6 py-24">
        <div className="flex w-full max-w-[1280px] grow shrink-0 basis-0 flex-wrap items-center justify-center gap-12">
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch">
            <div className="flex h-144 w-full min-w-[240px] max-w-[448px] flex-none flex-col items-center justify-center gap-2 overflow-hidden">
              <img
                className="w-full grow shrink-0 basis-0 object-cover"
                src="https://res.cloudinary.com/subframe/image/upload/v1724690075/uploads/302/ajop7v0t3y1bjmf9obyp.png"
              />
            </div>
          </div>
          <div className="flex min-w-[320px] grow shrink-0 basis-0 flex-col items-start justify-center gap-10 self-stretch">
            <div className="flex w-full max-w-[576px] flex-col items-start justify-center gap-10">
              <div className="flex flex-col items-start justify-center gap-4">
                <span className="font-['Montserrat'] text-[30px] font-[700] leading-[34px] text-brand-300 -tracking-[0.025em]">
                  Amplify your enterprise&#39;s intergalactic reach
                </span>
                <span className="whitespace-pre-wrap font-['Montserrat'] text-[18px] font-[400] leading-[26px] text-white -tracking-[0.01em]">
                  {
                    'From lone star traders to galactic conglomerates, FinEdge orchestrates your cosmic capital symphony. Synchronize interstellar transactions, conduct payroll across star systems, and calibrate your antimatter.'
                  }
                </span>
              </div>
              <Button variant="brand-secondary" size="large">
                Explore cosmic commerce
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full grow shrink-0 basis-0 flex-col items-center gap-2 bg-default-background px-6 py-24">
        <div className="flex w-full max-w-[1280px] grow shrink-0 basis-0 flex-wrap items-center justify-center gap-12">
          <div className="flex min-w-[320px] grow shrink-0 basis-0 flex-col items-center justify-center gap-10 self-stretch">
            <span className="whitespace-pre-wrap font-['Montserrat'] text-[72px] font-[900] leading-[68px] text-default-font -tracking-[0.04em] mobile:font-['Montserrat'] mobile:text-[48px] mobile:font-[900] mobile:leading-[44px] mobile:tracking-normal">
              {'BUILT FOR FINANCIAL VOYAGERS'}
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-2 self-stretch">
            <div className="flex h-144 w-full min-w-[320px] max-w-[448px] flex-none flex-col items-start justify-center gap-2 overflow-hidden rounded-3xl bg-brand-300 px-8 py-8 mobile:px-6 mobile:py-6">
              <div className="flex w-full grow shrink-0 basis-0 flex-col items-center justify-center gap-2">
                <span className="font-['Montserrat'] text-[28px] font-[600] leading-[36px] text-default-font -tracking-[0.025em]">
                  &quot;It&#39;s the quantum leap in banking that global nomads
                  and interstellar entrepreneurs have been waiting for.&quot;
                </span>
              </div>
              <div className="flex flex-col items-start justify-center gap-2 rounded-full bg-brand-900 px-6 py-4">
                <span className="font-['Inter'] text-[16px] font-[600] leading-[20px] text-white">
                  Captain Zara, Galactic Wanderer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full grow shrink-0 basis-0 flex-col items-center justify-center gap-2 px-6 py-24">
        <div className="flex w-full max-w-[1280px] flex-col items-center justify-center gap-8 rounded-[32px] bg-brand-900 px-6 pt-28 pb-16">
          <div className="flex w-full flex-col items-center justify-center gap-6 pt-32">
            <span className="w-full max-w-[768px] whitespace-pre-wrap font-['Montserrat'] text-[72px] font-[900] leading-[68px] text-brand-300 text-center -tracking-[0.04em] mobile:font-['Montserrat'] mobile:text-[48px] mobile:font-[900] mobile:leading-[44px] mobile:tracking-normal">
              {'UNLEASH THE FINANCIAL MULTI-VERSE'}
            </span>
            <span className="w-full max-w-[768px] whitespace-pre-wrap font-['Montserrat'] text-[20px] font-[500] leading-[28px] text-white text-center -tracking-[0.015em]">
              {
                "We're crafting the ultimate portal for your interstellar wealth. Microscopic fees. Warp-speed simplicity. Quantum efficiency. Welcome to the future of finance."
              }
            </span>
          </div>
          <Button variant="brand-secondary" size="large">
            Activate your portal
          </Button>
        </div>
      </div>
      <div className="flex w-full flex-col items-start">
        <BoldFooter />
      </div>
    </div>
  );
}
export default Home;
