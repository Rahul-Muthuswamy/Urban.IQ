import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 z-[100] pointer-events-none"
      // style={{ position: "fixed", top: 0, left: 0 }}
    >
      <Link to="/home" className="block">
        <img
          src="/assets/7_remove_bg.png"
          alt="Urban.IQ Logo"
          aria-label="UrbanIQ logo"
          // className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 object-contain drop-shadow-2xl pointer-events-auto"
          className=" object-contain h-40 w-40 pointer-events-auto"
          // style={{
          //   filter: "drop-shadow(0 10px 25px rgba(132, 204, 22, 0.3)) drop-shadow(0 0 40px rgba(132, 204, 22, 0.2))",
          //   display: "block",
          // }}
          onError={(e) => {
            console.error("Logo image failed to load:", e);
            e.target.style.display = "none";
          }}
          onLoad={() => {
            console.log("Logo image loaded successfully");
          }}
        />
      </Link>
    </motion.div>
  );
}










