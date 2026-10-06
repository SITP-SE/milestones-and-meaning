import { GiftIcon, HeartIcon, MountainsIcon, SproutIcon } from '@/components/ui/icons';

const promises = [
  { Icon: HeartIcon, title: 'Client-Centered', detail: 'You set the pace' },
  { Icon: SproutIcon, title: 'Warm & Inclusive', detail: 'All relationships welcome' },
<<<<<<< HEAD
  { Icon: MountainsIcon, title: 'Real Support', detail: 'Practical, caring guidance' },
=======
  { Icon: MountainsIcon, title: 'Real Support', detail: 'Practical, compassionate guidance' },
>>>>>>> origin
  { Icon: GiftIcon, title: 'Meaningful Milestones', detail: 'Marking what matters' },
];

export default function TrustBar() {
  return (
    <ul className="mx-auto mt-4 grid w-full max-w-[1200px] grid-cols-2 px-6 py-2 lg:mt-[50px] lg:flex lg:flex-nowrap lg:items-center lg:justify-center lg:px-[50px] lg:py-5">
      {promises.map(({ Icon, title, detail }, index) => (
        <li
          key={title}
<<<<<<< HEAD
          className={`border-blush flex min-w-0 items-center ${index % 2 === 0 ? 'border-r lg:border-r-0' : ''} ${index < 2 ? 'border-b lg:border-b-0' : ''}`}
=======
          className={`border-blush flex items-center ${index % 2 === 0 ? 'border-r lg:border-r-0' : ''} ${index < 2 ? 'border-b lg:border-b-0' : ''}`}
>>>>>>> origin
        >
          {index > 0 && (
            <span aria-hidden="true" className="bg-blush hidden h-[65px] w-px shrink-0 lg:block" />
          )}
<<<<<<< HEAD
          <div className="flex min-w-0 items-center gap-2 px-2 py-3 lg:gap-5 lg:p-2.5">
            <Icon className="text-terracotta h-auto w-5 shrink-0 lg:w-10" />
            <div className="flex min-w-0 flex-col gap-1 lg:gap-[9px]">
              <p className="text-ink text-[0.8125rem] leading-tight font-bold lg:text-body">{title}</p>
              <p className="text-ink text-[0.8125rem] leading-tight lg:text-body">{detail}</p>
=======
          <div className="flex items-center gap-2.5 px-3 py-4 lg:gap-5 lg:p-2.5">
            <Icon className="text-terracotta h-7 w-auto shrink-0 lg:h-auto" />
            <div className="flex flex-col gap-[9px]">
              <p className="text-body text-ink font-bold">{title}</p>
              <p className="text-body text-ink">{detail}</p>
>>>>>>> origin
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
