import { BoldNavbar } from '../../ui/components/BoldNavbar';
import { BoldNavbarMobile } from '../../ui/components/BoldNavbarMobile';

function Header() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 bg-default-background px-6 py-6 mobile:px-2 mobile:py-2">
      <BoldNavbar className="mobile:hidden" />
      <BoldNavbarMobile className="hidden mobile:flex" />
    </div>
  );
}

export default Header;
