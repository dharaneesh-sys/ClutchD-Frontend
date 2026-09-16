import { Mail, Lock, Store, User, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/Input";

export function SellerFields({ register, errors }) {
  return (
    <div className="space-y-4">
      <Input
        label="Store Name *"
        icon={Store}
        placeholder="e.g. Sharma Auto Parts"
        {...register("storeName")}
        error={errors.storeName?.message}
      />

      <Input
        label="Owner / Manager Name *"
        icon={User}
        placeholder="e.g. Rahul Sharma"
        {...register("fullName")}
        error={errors.fullName?.message}
      />

      <Input
        label="Email Address *"
        type="email"
        icon={Mail}
        placeholder="name@example.com"
        {...register("email")}
        error={errors.email?.message}
      />

      <Input
        label="Phone Number *"
        type="tel"
        icon={Phone}
        placeholder="10-digit mobile number"
        {...register("phone")}
        error={errors.phone?.message}
      />

      <Input
        label="Store Location *"
        icon={MapPin}
        placeholder="e.g. Ernakulam, Kochi"
        {...register("location")}
        error={errors.location?.message}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Password *"
          type="password"
          icon={Lock}
          placeholder="Min 8 chars, 1 upper, 1 number"
          {...register("password")}
          error={errors.password?.message}
        />

        <Input
          label="Confirm Password *"
          type="password"
          icon={Lock}
          placeholder="Repeat password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
      </div>
    </div>
  );
}
