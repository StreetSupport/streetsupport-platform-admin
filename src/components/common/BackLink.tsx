import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';

interface BackLinkProps {
  href: string;
  text: string;
}

const BackLink: React.FC<BackLinkProps> = ({ href, text }) => {
  return (
    <Link href={href} className="inline-flex items-center text-sm font-medium text-brand-a hover:text-brand-b mb-4">
      <ChevronLeftIcon className="w-5 h-5 mr-1" />
      {text}
    </Link>
  );
};

export default BackLink;
