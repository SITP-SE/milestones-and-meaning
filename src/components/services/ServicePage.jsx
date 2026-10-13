import ServiceCallbackForm from './ServiceCallbackForm';
import ServiceExplain from './ServiceExplain';
import ServiceFeatures from './ServiceFeatures';
import ServiceHero from './ServiceHero';
import ServiceIncluded from './ServiceIncluded';
import ServiceOffering from './ServiceOffering';
import ServicePrompt from './ServicePrompt';
import ServiceReasons from './ServiceReasons';
import ServiceResources from './ServiceResources';
import ServiceSteps from './ServiceSteps';

const tones = {
  cream: 'bg-cream',
  shell: 'bg-shell',
  linen: 'bg-linen',
};

function Prompt({ prompt }) {
  return <ServicePrompt title={prompt.title} body={prompt.body} cta={prompt.cta} />;
}

export default function ServicePage({ content }) {
  const promptFirst = content.prompt?.placement === 'start';
  const hasIvoryBody =
    content.steps?.length > 0 ||
    content.offering ||
    content.explain ||
    content.included ||
    content.reasons ||
    content.resources ||
    content.callbackForm;
  const showInviteWithFeatures = Boolean(content.invite && !hasIvoryBody);
  const showEndPromptOnTone = Boolean(content.prompt && !promptFirst && !hasIvoryBody);
  const tone = tones[content.hero?.tone] ?? 'bg-linen';

  return (
    <>
      {content.hero && <ServiceHero {...content.hero} />}
      {(content.features || showInviteWithFeatures || showEndPromptOnTone) && (
        <section className="bg-ivory">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-6 py-16 lg:gap-20 lg:px-[50px] lg:py-20">
            {content.features && <ServiceFeatures items={content.features} />}
            {showInviteWithFeatures && <ServiceExplain {...content.invite} />}
            {showEndPromptOnTone && <Prompt prompt={content.prompt} />}
          </div>
        </section>
      )}
      {promptFirst && (
        <div className={`${tone} px-6 pt-4 pb-20 lg:px-[50px] lg:pt-8 lg:pb-28`}>
          <div className="mx-auto w-full max-w-[1100px] lg:pr-10">
            <Prompt prompt={content.prompt} />
          </div>
        </div>
      )}
      {hasIvoryBody && (
        <section className="bg-ivory">
          <div
            className={`mx-auto flex w-full max-w-[1200px] flex-col px-6 lg:px-[50px] ${
              content.reasons || content.resources
                ? 'gap-20 py-16 lg:gap-28 lg:py-24'
                : 'gap-16 py-12 lg:gap-20 lg:py-[50px]'
            }`}
          >
            {content.explain && <ServiceExplain {...content.explain} />}
            {content.included && <ServiceIncluded {...content.included} />}
            {content.steps?.length > 0 && (
              <ServiceSteps eyebrow={content.stepsEyebrow} steps={content.steps} />
            )}
            {content.invite && hasIvoryBody && <ServiceExplain {...content.invite} />}
            {content.offering && <ServiceOffering {...content.offering} />}
            {content.reasons && <ServiceReasons {...content.reasons} />}
            {content.callbackForm && <ServiceCallbackForm {...content.callbackForm} />}
            {content.resources && <ServiceResources {...content.resources} />}
            {content.prompt && !promptFirst && <Prompt prompt={content.prompt} />}
          </div>
        </section>
      )}
    </>
  );
}
