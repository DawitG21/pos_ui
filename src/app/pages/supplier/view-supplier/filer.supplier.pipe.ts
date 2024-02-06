import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "customFilterSupplier",
})
export class CustomFilterSuppliersPipe implements PipeTransform {
  transform(items: any[], searchTerm: string): any[] {
    if (!items || !searchTerm) {
      return items;
    }

    searchTerm = searchTerm.toLowerCase();

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.address.city.toLowerCase().includes(searchTerm) ||
        item.address.country.toLowerCase().includes(searchTerm) ||
        item.phone.code.toString().toLowerCase().includes(searchTerm) ||
        item.phone.number.toString().toLowerCase().includes(searchTerm) ||
        (item.status ? "active" : "inactive").includes(searchTerm)
      );
    });
  }
}
