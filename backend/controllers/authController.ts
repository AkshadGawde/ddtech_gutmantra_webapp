import bcrypt from "bcrypt";
import { verifyWPPassword } from "../utils/wpPassword";
import { getUserByEmail, updateUser } from "../services/userService";

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let isValid = false;

    // 🔥 OLD WP USER
    if (user.migrationStatus === "pending") {
      isValid = verifyWPPassword(password, user.legacyPasswordHash);

      if (isValid) {
        const newHash = await bcrypt.hash(password, 10);

        await updateUser(user.id, {
          password: newHash,
          migrationStatus: "completed",
          legacyPasswordHash: null,
        });

        console.log("✅ User upgraded from WP hash → bcrypt");
      }
    }

    // 🔥 NEW USER
    else {
      isValid = await bcrypt.compare(password, user.password);
    }

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      user,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}