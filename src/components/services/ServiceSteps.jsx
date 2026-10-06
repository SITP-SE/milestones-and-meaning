export default function ServiceSteps({ steps }) {
  return (
    <ol className="flex flex-col gap-8 md:flex-row md:justify-between">
      {steps.map((step, index) => (
        <li key={step.title} className="flex items-center gap-4 md:contents">
          {index > 0 && (
            <span
              aria-hidden="true"
              className="bg-blush/65 hidden h-[100px] w-px shrink-0 md:block"
            />
          )}
          <div className="flex items-center gap-4">
            <span className="bg-apricot text-lead flex size-[50px] shrink-0 items-center justify-center rounded-full text-white">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className="font-wordmark text-ink text-[1.625rem] leading-none">{step.title}</h2>
              <p className="text-body text-ink mt-2 leading-normal">
                {step.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
