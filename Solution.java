import java.io.*;
import java.util.*;
import java.text.*;
import java.math.*;
import java.util.regex.*;

class Solution {

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        Document[] documents = new Document[4];

        for (int i = 0; i < 4; i++) {
            int id = Integer.parseInt(reader.readLine());
            String title = reader.readLine();
            String folderName = reader.readLine();
            int pages = Integer.parseInt(reader.readLine());

            documents[i] = new Document(id, title, folderName, pages);
        }
        reader.close();

        Document[] oddPageDocs = docsWithOddPages(documents);

        Arrays.sort(oddPageDocs, Comparator.comparingInt(Document::getId));

        for (Document doc : oddPageDocs) {
            System.out.println(doc.getId() + " " + doc.getTitle() + " " + doc.getFolderName() + " " + doc.getPages());
        }
    }

    public static Document[] docsWithOddPages(Document[] documents) {
        ArrayList<Document> resultList = new ArrayList<>();
        for (Document doc : documents) {
            if (doc.getPages() % 2 != 0) {
                resultList.add(doc);
            }
        }
        return resultList.toArray(new Document[0]);
    }
}

class Document {
    private int id;
    private String title;
    private String folderName;
    private int pages;

    public Document(int id, String title, String folderName, int pages) {
        this.id = id;
        this.title = title;
        this.folderName = folderName;
        this.pages = pages;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getFolderName() {
        return folderName;
    }

    public void setFolderName(String folderName) {
        this.folderName = folderName;
    }

    public int getPages() {
        return pages;
    }

    public void setPages(int pages) {
        this.pages = pages;
    }
}
