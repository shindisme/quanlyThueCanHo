import { Fragment } from "react";
import { useHeaderBreadcrumb } from "./hooks/useHeaderBreadcrumb";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/Breadcrumb";

export function HeaderBreadcrumb() {
  const parts = useHeaderBreadcrumb();

  if (!parts || parts.length === 0) return null;

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        {parts.map((part, i) => {
          const isLast = i === parts.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{part}</BreadcrumbPage>
                ) : (
                  <span className="text-gray-400">{part}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default HeaderBreadcrumb;
