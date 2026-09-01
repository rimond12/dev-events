import Link from "next/link";
import Image from "next/image";

/**
 * Navbar component - Main navigation header with logo and navigation links.
 * @returns React component
 */
const Navbar = () => {
    return (
        <header>
            <nav>
                <Link href="/" className="logo">
                    <Image src="/icons/logo.png" alt="logo" width={24} height={24} />

                    <p>DevEvent</p>
                </Link>
                <ul>
                    <Link href="/">Home</Link>
                    <Link href="/">Events</Link>
                    <Link href="/">Creat Event</Link>
                </ul>
            </nav>
        </header>
    )
}
export default Navbar
