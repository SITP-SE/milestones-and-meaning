function Bone({ className }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}

export default function PageLoading() {
  return (
    <section className="bg-shell" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-16 lg:px-[50px] lg:pt-[100px] lg:pb-[50px]">
        <Bone className="h-5 w-40" />
        <Bone className="h-12 w-full max-w-[36rem]" />
        <Bone className="h-12 w-4/5 max-w-[28rem]" />
        <div className="mt-4 flex flex-col gap-2">
          <Bone className="h-4 w-full max-w-[40rem]" />
          <Bone className="h-4 w-5/6 max-w-[34rem]" />
          <Bone className="h-4 w-2/3 max-w-[24rem]" />
        </div>
      </div>
    </section>
  );
}
